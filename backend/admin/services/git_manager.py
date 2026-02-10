"""
Git Manager - Handle all git operations for the admin tool
"""

import subprocess
from typing import Dict, List, Tuple


class GitManager:
    """Manages git operations for the local admin tool"""

    def __init__(self, repo_root: str):
        self.repo_root = repo_root

    def _run_git_command(self, args: List[str], check=True) -> Tuple[str, str, int]:
        """
        Run a git command and return (stdout, stderr, returncode)

        Args:
            args: List of command arguments (e.g., ['status', '--short'])
            check: If True, raise exception on non-zero exit code

        Returns:
            Tuple of (stdout, stderr, returncode)
        """
        try:
            result = subprocess.run(
                ['git'] + args,
                cwd=self.repo_root,
                capture_output=True,
                text=True,
                check=check
            )
            return result.stdout.strip(), result.stderr.strip(), result.returncode
        except subprocess.CalledProcessError as e:
            return e.stdout.strip(), e.stderr.strip(), e.returncode

    def get_current_branch(self) -> str:
        """Get the name of the current git branch"""
        stdout, _, _ = self._run_git_command(['rev-parse', '--abbrev-ref', 'HEAD'])
        return stdout

    def get_last_commit(self) -> Dict[str, str]:
        """
        Get information about the last commit

        Returns:
            Dict with 'hash', 'hash_short', 'message', 'author', 'date'
        """
        # Get commit hash
        hash_full, _, _ = self._run_git_command(['rev-parse', 'HEAD'])
        hash_short, _, _ = self._run_git_command(['rev-parse', '--short', 'HEAD'])

        # Get commit message
        message, _, _ = self._run_git_command(['log', '-1', '--pretty=%s'])

        # Get author
        author, _, _ = self._run_git_command(['log', '-1', '--pretty=%an'])

        # Get date
        date, _, _ = self._run_git_command(['log', '-1', '--pretty=%ar'])

        return {
            'hash': hash_full,
            'hash_short': hash_short,
            'message': message,
            'author': author,
            'date': date
        }

    def get_status(self) -> Dict[str, any]:
        """
        Get current git repository status

        Returns:
            Dict with 'branch', 'clean', 'changed_files', 'untracked_files'
        """
        branch = self.get_current_branch()

        # Get status in short format
        status_output, _, _ = self._run_git_command(['status', '--short'])

        changed_files = []
        untracked_files = []

        if status_output:
            for line in status_output.split('\n'):
                if not line:
                    continue
                status_code = line[:2]
                filename = line[3:]

                if status_code.strip() == '??':
                    untracked_files.append(filename)
                else:
                    changed_files.append(filename)

        return {
            'branch': branch,
            'clean': len(changed_files) == 0 and len(untracked_files) == 0,
            'changed_files': changed_files,
            'untracked_files': untracked_files,
            'total_changes': len(changed_files) + len(untracked_files)
        }

    def stage_files(self, file_paths: List[str]) -> Tuple[bool, str]:
        """
        Stage files for commit (git add)

        Args:
            file_paths: List of file paths relative to repo root

        Returns:
            Tuple of (success: bool, message: str)
        """
        if not file_paths:
            return False, "No files specified to stage"

        try:
            stdout, stderr, code = self._run_git_command(['add'] + file_paths)
            if code == 0:
                return True, f"Staged {len(file_paths)} file(s)"
            else:
                return False, f"Git add failed: {stderr or stdout}"
        except Exception as e:
            return False, f"Error staging files: {str(e)}"

    def commit(self, message: str) -> Tuple[bool, str, str]:
        """
        Create a git commit

        Args:
            message: Commit message

        Returns:
            Tuple of (success: bool, commit_hash: str, message: str)
        """
        if not message:
            return False, "", "Commit message cannot be empty"

        try:
            stdout, stderr, code = self._run_git_command(['commit', '-m', message])

            if code == 0:
                # Get the new commit hash
                new_hash, _, _ = self._run_git_command(['rev-parse', '--short', 'HEAD'])
                return True, new_hash, f"Committed as {new_hash}"
            else:
                return False, "", f"Commit failed: {stderr or stdout}"
        except Exception as e:
            return False, "", f"Error creating commit: {str(e)}"

    def push(self, remote: str = 'origin', branch: str = None) -> Tuple[bool, str]:
        """
        Push commits to remote repository

        Args:
            remote: Remote name (default: 'origin')
            branch: Branch name (default: current branch)

        Returns:
            Tuple of (success: bool, message: str)
        """
        if branch is None:
            branch = self.get_current_branch()

        try:
            stdout, stderr, code = self._run_git_command(['push', remote, branch])

            if code == 0:
                return True, f"Pushed to {remote}/{branch}"
            else:
                error_msg = stderr or stdout
                # Provide helpful error messages
                if "rejected" in error_msg.lower():
                    return False, "Push rejected. You may need to pull first: git pull --rebase"
                elif "authentication" in error_msg.lower() or "permission" in error_msg.lower():
                    return False, "Authentication failed. Check your git credentials."
                else:
                    return False, f"Push failed: {error_msg}"
        except Exception as e:
            return False, f"Error pushing to remote: {str(e)}"

    def pull(self, remote: str = 'origin', branch: str = None, rebase: bool = True) -> Tuple[bool, str]:
        """
        Pull updates from remote repository

        Args:
            remote: Remote name (default: 'origin')
            branch: Branch name (default: current branch)
            rebase: Use rebase instead of merge (default: True)

        Returns:
            Tuple of (success: bool, message: str)
        """
        if branch is None:
            branch = self.get_current_branch()

        try:
            args = ['pull']
            if rebase:
                args.append('--rebase')
            args.extend([remote, branch])

            stdout, stderr, code = self._run_git_command(args)

            if code == 0:
                return True, f"Pulled from {remote}/{branch}"
            else:
                return False, f"Pull failed: {stderr or stdout}"
        except Exception as e:
            return False, f"Error pulling from remote: {str(e)}"

    def dry_run_preview(self, file_paths: List[str], message: str) -> Dict[str, any]:
        """
        Show what would be committed without actually committing

        Args:
            file_paths: List of file paths that would be staged
            message: Commit message that would be used

        Returns:
            Dict with preview information
        """
        current_status = self.get_status()
        last_commit = self.get_last_commit()

        # Show diff for files that would be committed
        diffs = {}
        for file_path in file_paths:
            try:
                stdout, _, code = self._run_git_command(['diff', file_path], check=False)
                if code == 0 and stdout:
                    diffs[file_path] = stdout
            except:
                pass

        return {
            'would_stage': file_paths,
            'would_commit_message': message,
            'current_branch': current_status['branch'],
            'current_commit': last_commit['hash_short'],
            'diffs': diffs,
            'files_modified': len(file_paths)
        }

    def check_repo_clean(self) -> Tuple[bool, str]:
        """
        Check if the repository is in a clean state (no uncommitted changes)

        Returns:
            Tuple of (is_clean: bool, message: str)
        """
        status = self.get_status()

        if status['clean']:
            return True, "Repository is clean"
        else:
            msg = f"Repository has {status['total_changes']} uncommitted change(s)"
            if status['changed_files']:
                msg += f"\nModified: {', '.join(status['changed_files'][:5])}"
                if len(status['changed_files']) > 5:
                    msg += f" and {len(status['changed_files']) - 5} more"
            return False, msg

    def get_remote_status(self) -> Dict[str, any]:
        """
        Check if local branch is ahead/behind remote

        Returns:
            Dict with 'ahead', 'behind', 'diverged', 'synced' status
        """
        branch = self.get_current_branch()

        # Fetch to get latest remote state (without merging)
        self._run_git_command(['fetch', 'origin'], check=False)

        # Check ahead/behind
        stdout, _, code = self._run_git_command(
            ['rev-list', '--left-right', '--count', f'{branch}...origin/{branch}'],
            check=False
        )

        if code != 0:
            return {'error': True, 'message': 'Could not check remote status'}

        try:
            parts = stdout.split()
            ahead = int(parts[0]) if len(parts) > 0 else 0
            behind = int(parts[1]) if len(parts) > 1 else 0
        except (ValueError, IndexError):
            ahead, behind = 0, 0

        return {
            'ahead': ahead,
            'behind': behind,
            'diverged': ahead > 0 and behind > 0,
            'synced': ahead == 0 and behind == 0,
            'error': False
        }

    def stash_changes(self) -> Tuple[bool, str]:
        """
        Stash uncommitted changes

        Returns:
            Tuple of (success: bool, message: str)
        """
        stdout, stderr, code = self._run_git_command(['stash', 'push', '-m', 'Admin tool auto-stash'])
        if code == 0:
            return True, "Changes stashed successfully"
        return False, f"Stash failed: {stderr or stdout}"

    def stash_pop(self) -> Tuple[bool, str]:
        """
        Pop stashed changes

        Returns:
            Tuple of (success: bool, message: str)
        """
        stdout, stderr, code = self._run_git_command(['stash', 'pop'], check=False)
        if code == 0:
            return True, "Stash applied successfully"
        return False, f"Stash pop failed: {stderr or stdout}"

    def sync_with_remote(self) -> Tuple[bool, str]:
        """
        Sync local repo with remote. Handles uncommitted changes by stashing.

        Steps:
        1. Check for uncommitted changes
        2. Stash if needed
        3. Pull with rebase
        4. Pop stash if needed

        Returns:
            Tuple of (success: bool, message: str)
        """
        # Step 1: Check for uncommitted changes
        is_clean, _ = self.check_repo_clean()
        had_changes = not is_clean

        # Step 2: Stash if needed
        if had_changes:
            stash_ok, stash_msg = self.stash_changes()
            if not stash_ok:
                return False, f"Could not stash changes: {stash_msg}"

        # Step 3: Pull with rebase
        pull_ok, pull_msg = self.pull(rebase=True)
        if not pull_ok:
            # Try to restore stash if pull failed
            if had_changes:
                self.stash_pop()
            return False, f"Pull failed: {pull_msg}"

        # Step 4: Pop stash if we had changes
        if had_changes:
            pop_ok, pop_msg = self.stash_pop()
            if not pop_ok:
                return False, f"Synced but could not restore your changes: {pop_msg}"
            return True, "Synced with remote and restored your changes"

        return True, "Synced with remote"

    def has_staged_changes(self) -> bool:
        """
        Check if there are any staged changes ready to commit

        Returns:
            True if there are staged changes, False otherwise
        """
        # git diff --cached --quiet returns 0 if no changes, 1 if there are changes
        _, _, code = self._run_git_command(['diff', '--cached', '--quiet'], check=False)
        return code != 0  # Non-zero means there ARE staged changes

    def get_full_status(self) -> Dict[str, any]:
        """
        Get comprehensive git status including remote sync state

        Returns:
            Dict with local status + remote status
        """
        local_status = self.get_status()
        remote_status = self.get_remote_status()
        last_commit = self.get_last_commit()

        return {
            **local_status,
            'remote': remote_status,
            'last_commit': last_commit,
            'can_publish': (
                local_status['clean'] and
                not remote_status.get('error', False) and
                remote_status.get('synced', False)
            )
        }
