#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';

// 環境変数の取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || '';

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const git = simpleGit();

interface Improvement {
  priority: 'high' | 'medium' | 'low';
  title: string;
  location: string;
  description: string;
  solution: string;
  file?: string;
  line?: number;
}

/**
 * CODE_IMPROVEMENTS.mdを解析して改善点リストを取得
 */
function parseImprovements(): Improvement[] {
  const improvementsPath = path.join(process.cwd(), 'CODE_IMPROVEMENTS.md');
  if (!fs.existsSync(improvementsPath)) {
    console.log('CODE_IMPROVEMENTS.md not found');
    return [];
  }

  const content = fs.readFileSync(improvementsPath, 'utf-8');
  const improvements: Improvement[] = [];
  
  let currentPriority: 'high' | 'medium' | 'low' | null = null;
  let currentTitle = '';
  let currentLocation = '';
  let currentDescription = '';
  let currentSolution = '';
  let currentFile = '';
  let currentLine: number | undefined;

  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 優先度セクションの検出
    if (line.includes('🔴 高優先度')) {
      currentPriority = 'high';
      continue;
    } else if (line.includes('🟡 中優先度')) {
      currentPriority = 'medium';
      continue;
    } else if (line.includes('🟢 低優先度')) {
      currentPriority = 'low';
      continue;
    }
    
    // 改善項目の検出
    if (line.match(/^### \d+\./)) {
      // 前の改善項目を保存
      if (currentPriority && currentTitle) {
        improvements.push({
          priority: currentPriority,
          title: currentTitle,
          location: currentLocation,
          description: currentDescription,
          solution: currentSolution,
          file: currentFile || undefined,
          line: currentLine,
        });
      }
      
      // 新しい改善項目の開始
      currentTitle = line.replace(/^### \d+\.\s*/, '').trim();
      currentLocation = '';
      currentDescription = '';
      currentSolution = '';
      currentFile = '';
      currentLine = undefined;
    } else if (line.startsWith('**場所**:')) {
      const locationMatch = line.match(/\*\*場所\*\*:\s*(.+)/);
      if (locationMatch) {
        currentLocation = locationMatch[1].trim();
        // ファイル名と行番号を抽出
        const fileMatch = currentLocation.match(/([^:]+):(\d+)/);
        if (fileMatch) {
          currentFile = fileMatch[1];
          currentLine = parseInt(fileMatch[2], 10);
        }
      }
    } else if (line.startsWith('- **修正**:')) {
      currentSolution = line.replace(/^-\s*\*\*修正\*\*:\s*/, '').trim();
    } else if (line.startsWith('-') && currentDescription === '') {
      currentDescription = line.replace(/^-\s*/, '').trim();
    } else if (line.startsWith('```') && currentSolution) {
      // コードブロック内の解決策を取得
      let codeBlock = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeBlock += lines[i] + '\n';
        i++;
      }
      currentSolution += '\n' + codeBlock.trim();
    }
  }
  
  // 最後の改善項目を保存
  if (currentPriority && currentTitle) {
    improvements.push({
      priority: currentPriority,
      title: currentTitle,
      location: currentLocation,
      description: currentDescription,
      solution: currentSolution,
      file: currentFile || undefined,
      line: currentLine,
    });
  }
  
  return improvements;
}

/**
 * 優先度の高い改善点を選択（高→中→低の順）
 */
function selectImprovements(improvements: Improvement[], maxCount: number = 3): Improvement[] {
  const highPriority = improvements.filter(i => i.priority === 'high');
  const mediumPriority = improvements.filter(i => i.priority === 'medium');
  const lowPriority = improvements.filter(i => i.priority === 'low');
  
  const selected: Improvement[] = [];
  
  // 高優先度から選択
  if (selected.length < maxCount && highPriority.length > 0) {
    selected.push(...highPriority.slice(0, maxCount - selected.length));
  }
  
  // 中優先度から選択
  if (selected.length < maxCount && mediumPriority.length > 0) {
    selected.push(...mediumPriority.slice(0, maxCount - selected.length));
  }
  
  // 低優先度から選択
  if (selected.length < maxCount && lowPriority.length > 0) {
    selected.push(...lowPriority.slice(0, maxCount - selected.length));
  }
  
  return selected;
}

/**
 * OpenAI APIを使ってコード改善を生成
 */
async function generateImprovement(
  improvement: Improvement,
  fileContent: string
): Promise<string | null> {
  try {
    const prompt = `You are a code improvement assistant. Analyze the following code and implement the improvement described.

Improvement: ${improvement.title}
Description: ${improvement.description}
Location: ${improvement.location}
Solution: ${improvement.solution}

Current code:
\`\`\`typescript
${fileContent}
\`\`\`

Please provide the complete improved code. Return only the code, without markdown formatting or explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a TypeScript/React code improvement expert. Provide only the improved code without explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const improvedCode = response.choices[0]?.message?.content?.trim();
    if (!improvedCode) {
      return null;
    }

    // コードブロックからコードを抽出
    const codeMatch = improvedCode.match(/```(?:typescript|tsx|ts)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1] : improvedCode;
  } catch (error) {
    console.error(`Error generating improvement for ${improvement.title}:`, error);
    return null;
  }
}

/**
 * ファイルを読み込む
 */
function readFile(filePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * ファイルに書き込む
 */
function writeFile(filePath: string, content: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

/**
 * 簡単な改善を直接適用（AIを使わない）
 */
function applySimpleImprovement(improvement: Improvement): boolean {
  if (!improvement.file) {
    return false;
  }

  const filePath = improvement.file;
  let content = readFile(filePath);
  if (!content) {
    return false;
  }

  let modified = false;

  // 改善1: 未使用変数の削除
  if (improvement.title.includes('未使用の変数') && improvement.line) {
    const lines = content.split('\n');
    if (lines[improvement.line - 1]?.includes('const [loading, setLoading]')) {
      // 未使用変数を削除
      lines.splice(improvement.line - 1, 1);
      content = lines.join('\n');
      modified = true;
      console.log(`✓ Removed unused variable in ${filePath}:${improvement.line}`);
    }
  }

  // 改善9: マジックナンバーの定数化
  if (improvement.title.includes('マジックナンバー') && improvement.file.includes('CalendarGrid')) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const remainingCells = 42 -')) {
        // 定数を追加
        const constantsToAdd = `const CALENDAR_WEEKS = 6;
const DAYS_PER_WEEK = 7;
const TOTAL_CALENDAR_CELLS = CALENDAR_WEEKS * DAYS_PER_WEEK;
`;
        
        // 関数の開始位置を探す
        let insertIndex = i;
        while (insertIndex > 0 && !lines[insertIndex].match(/^(export\s+)?(function|const)\s+\w+/)) {
          insertIndex--;
        }
        
        lines.splice(insertIndex, 0, constantsToAdd);
        // 元の行を修正
        lines[i + 1] = lines[i + 1].replace('42', 'TOTAL_CALENDAR_CELLS');
        content = lines.join('\n');
        modified = true;
        console.log(`✓ Replaced magic number with constants in ${filePath}`);
        break;
      }
    }
  }

  if (modified) {
    return writeFile(filePath, content);
  }

  return false;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Starting auto-improve process...\n');

  // 改善点を読み込む
  const allImprovements = parseImprovements();
  console.log(`📋 Found ${allImprovements.length} improvements in CODE_IMPROVEMENTS.md`);

  // 優先度の高い改善点を選択
  const selectedImprovements = selectImprovements(allImprovements, 3);
  console.log(`🎯 Selected ${selectedImprovements.length} improvements to apply\n`);

  let appliedCount = 0;

  for (const improvement of selectedImprovements) {
    console.log(`\n📝 Processing: ${improvement.title}`);
    console.log(`   Location: ${improvement.location}`);
    console.log(`   Priority: ${improvement.priority}`);

    // 簡単な改善は直接適用
    if (applySimpleImprovement(improvement)) {
      appliedCount++;
      continue;
    }

    // AIを使った改善
    if (improvement.file) {
      const fileContent = readFile(improvement.file);
      if (!fileContent) {
        console.log(`   ⚠️  Skipping: File not found`);
        continue;
      }

      console.log(`   🤖 Generating improvement with AI...`);
      const improvedCode = await generateImprovement(improvement, fileContent);
      
      if (improvedCode) {
        if (writeFile(improvement.file, improvedCode)) {
          console.log(`   ✅ Applied improvement to ${improvement.file}`);
          appliedCount++;
        } else {
          console.log(`   ❌ Failed to write file`);
        }
      } else {
        console.log(`   ⚠️  Could not generate improvement`);
      }
    } else {
      console.log(`   ⚠️  Skipping: No file specified`);
    }
  }

  console.log(`\n✨ Applied ${appliedCount} improvements`);
  
  if (appliedCount > 0) {
    console.log('\n📊 Summary of changes:');
    try {
      const status = await git.status();
      console.log(status);
    } catch (error) {
      console.error('Error getting git status:', error);
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

