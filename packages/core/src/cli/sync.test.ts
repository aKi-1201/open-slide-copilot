import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { syncSkills } from './sync.ts';

describe('syncSkills', () => {
  const originalCwd = process.cwd();
  let workspaceDir = '';

  beforeEach(async () => {
    workspaceDir = await mkdtemp(path.join(tmpdir(), 'open-slide-sync-'));
    process.chdir(workspaceDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (workspaceDir) await rm(workspaceDir, { recursive: true, force: true });
  });

  it('copies built-in skills into .agents/skills only', async () => {
    const skillsDir = path.join(workspaceDir, 'skills');
    const builtInSkillDir = path.join(skillsDir, 'create-slide');
    await mkdir(builtInSkillDir, { recursive: true });
    await writeFile(path.join(builtInSkillDir, 'SKILL.md'), 'hello\n');

    await syncSkills(skillsDir);

    expect(
      await readFile(
        path.join(workspaceDir, '.agents', 'skills', 'create-slide', 'SKILL.md'),
        'utf8',
      ),
    ).toBe('hello\n');
    expect(existsSync(path.join(workspaceDir, '.claude'))).toBe(false);
  });

  it('does not write files during dry run', async () => {
    const skillsDir = path.join(workspaceDir, 'skills');
    const builtInSkillDir = path.join(skillsDir, 'create-slide');
    await mkdir(builtInSkillDir, { recursive: true });
    await writeFile(path.join(builtInSkillDir, 'SKILL.md'), 'hello\n');

    await syncSkills(skillsDir, { dryRun: true });

    expect(existsSync(path.join(workspaceDir, '.agents'))).toBe(false);
  });
});
