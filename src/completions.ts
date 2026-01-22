const BASH_COMPLETION = `
# vibe bash completion
_vibe_completions() {
    local cur prev opts modes agents
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main options
    opts="-h --help -v --version -g --global -a --agent -s --mode -c --category -l --list -y --yes --json --preview"

    # Agents
    agents="opencode claude-code codex cursor"

    case "\${prev}" in
        -a|--agent)
            COMPREPLY=( $(compgen -W "\${agents}" -- \${cur}) )
            return 0
            ;;
        -c|--category)
            # Categories could be dynamically loaded, but here are common ones
            local categories="development languages testing documentation security devops ai-ml web mobile"
            COMPREPLY=( $(compgen -W "\${categories}" -- \${cur}) )
            return 0
            ;;
        -s|--mode|--preview)
            # Modes would ideally be loaded dynamically
            COMPREPLY=()
            return 0
            ;;
        *)
            ;;
    esac

    if [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
        return 0
    fi

    # Default to directory completion
    COMPREPLY=( $(compgen -d -- \${cur}) )
}

complete -F _vibe_completions vibe
`;

const ZSH_COMPLETION = `
#compdef vibe

_vibe() {
    local -a commands
    local -a options

    options=(
        '-h[Show help]'
        '--help[Show help]'
        '-v[Show version]'
        '--version[Show version]'
        '-g[Install globally]'
        '--global[Install globally]'
        '-a[Specify agents]:agent:(opencode claude-code codex cursor)'
        '--agent[Specify agents]:agent:(opencode claude-code codex cursor)'
        '-s[Specify modes]:mode:'
        '--mode[Specify modes]:mode:'
        '-c[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile)'
        '--category[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile)'
        '-l[List available modes]'
        '--list[List available modes]'
        '-y[Skip confirmations]'
        '--yes[Skip confirmations]'
        '--json[Output in JSON format]'
        '--preview[Preview a mode]:mode:'
    )

    _arguments -s \\
        \$options \\
        '*:directory:_files -/'
}

_vibe "\$@"
`;

const FISH_COMPLETION = `
# vibe fish completion

# Disable file completion by default
complete -c vibe -f

# Options
complete -c vibe -s h -l help -d "Show help"
complete -c vibe -s v -l version -d "Show version"
complete -c vibe -s g -l global -d "Install globally"
complete -c vibe -s y -l yes -d "Skip confirmations"
complete -c vibe -s l -l list -d "List available modes"
complete -c vibe -l json -d "Output in JSON format"

# Agent option
complete -c vibe -s a -l agent -d "Specify agent" -xa "opencode claude-code codex cursor"

# Category option
complete -c vibe -s c -l category -d "Filter by category" -xa "development languages testing documentation security devops ai-ml web mobile"

# Mode option (no completions, dynamic)
complete -c vibe -s s -l mode -d "Specify mode name"

# Preview option
complete -c vibe -l preview -d "Preview a mode"

# Directory argument
complete -c vibe -a "(__fish_complete_directories)"
`;

export type ShellType = "bash" | "zsh" | "fish";

export function getCompletionScript(shell: ShellType): string {
  switch (shell) {
    case "bash":
      return BASH_COMPLETION.trim();
    case "zsh":
      return ZSH_COMPLETION.trim();
    case "fish":
      return FISH_COMPLETION.trim();
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

export function getInstallInstructions(shell: ShellType): string {
  switch (shell) {
    case "bash":
      return `
# Add to your ~/.bashrc or ~/.bash_profile:
eval "$(vibe completions bash)"

# Or save to a file:
vibe completions bash > ~/.local/share/bash-completion/completions/vibe
`.trim();
    case "zsh":
      return `
# Add to your ~/.zshrc:
eval "$(vibe completions zsh)"

# Or save to your fpath:
vibe completions zsh > ~/.zsh/completions/_vibe
# Make sure ~/.zsh/completions is in your fpath
`.trim();
    case "fish":
      return `
# Save to fish completions directory:
vibe completions fish > ~/.config/fish/completions/vibe.fish
`.trim();
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

export function detectShell(): ShellType | null {
  const shell = process.env.SHELL || "";

  if (shell.includes("bash")) return "bash";
  if (shell.includes("zsh")) return "zsh";
  if (shell.includes("fish")) return "fish";

  return null;
}

export default {
  getCompletionScript,
  getInstallInstructions,
  detectShell,
};
