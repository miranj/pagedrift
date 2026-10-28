/**
 * Git operations on the project's repo.
 */

import { execFileSync } from 'node:child_process';

export function createGit(projectDir) {
  function git(...args) {
    return execFileSync('git', args, {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  return {
    /**
     * Whether the project is in a git work tree.
     */
    isRepo() {
      try {
        return git('rev-parse', '--is-inside-work-tree') === 'true';
      } catch {
        return false;
      }
    },

    /**
     * Whether tracked files have no uncommitted changes. Untracked files
     * (eg. a new pagedrift.config.mjs) are left alone by checkouts.
     */
    isClean() {
      return git('status', '--porcelain', '--untracked-files=no') === '';
    },

    /**
     * The checked out branch, or the commit SHA if HEAD is detached.
     */
    currentRef() {
      return git('branch', '--show-current') || git('rev-parse', 'HEAD');
    },

    /**
     * The commit SHA a ref points to, or null if there is no such commit.
     */
    resolveCommit(ref) {
      try {
        return git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
      } catch {
        return null;
      }
    },

    /**
     * Those of the given paths with changes between two commits.
     */
    changedPaths(from, to, paths) {
      return paths.filter((path) => {
        try {
          // Exits with an error when there are changes
          git('diff', '--quiet', from, to, '--', path);
          return false;
        } catch {
          return true;
        }
      });
    },

    /**
     * Checks out a branch, or detaches HEAD at any other ref (eg. a SHA).
     */
    checkout(ref) {
      // The trailing -- marks `ref` as a ref, even if a file has the same
      // name
      git('checkout', '--quiet', ref, '--');
    },
  };
}
