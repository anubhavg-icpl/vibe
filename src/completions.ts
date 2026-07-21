const BASH_COMPLETION = `
# vibe bash completion
_vibe_completions() {
    local cur prev opts agents kinds categories
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main options
    opts="-h --help -v --version -g --global -a --agent -s --asset -k --kind -c --category -l --list -y --yes --json --preview --no-animation --dry-run"

    # All 7 supported target CLIs
    agents="opencode claude-code codex cursor gemini-cli copilot-cli factory-droid"

    # Asset kinds
    kinds="skill agent command mode system-prompt"

    # Common categories
    categories="development languages testing documentation security devops ai-ml web mobile general"

    case "\${prev}" in
        -a|--agent)
            COMPREPLY=( $(compgen -W "\${agents}" -- \${cur}) )
            return 0
            ;;
        -k|--kind)
            COMPREPLY=( $(compgen -W "\${kinds}" -- \${cur}) )
            return 0
            ;;
        -c|--category)
            COMPREPLY=( $(compgen -W "\${categories}" -- \${cur}) )
            return 0
            ;;
        -s|--asset|--preview)
            # Asset names would ideally be loaded dynamically
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

    # Subcommands
    local words="\${COMP_WORDS[@]}"
    if [[ ! " \${words} " =~ " (add|list|info|doctor|search|targets|models|profile|config|run|exec|completions|init|uninstall|update) " ]]; then
        COMPREPLY=( $(compgen -W "add list info doctor search targets models profile config run exec completions init uninstall update" -- \${cur}) )
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
        '-a[Specify target CLIs]:agent:(opencode claude-code codex cursor gemini-cli copilot-cli factory-droid)'
        '--agent[Specify target CLIs]:agent:(opencode claude-code codex cursor gemini-cli copilot-cli factory-droid)'
        '-s[Specify asset names]:asset:'
        '--asset[Specify asset names]:asset:'
        '-k[Filter by kind]:kind:(skill agent command mode system-prompt)'
        '--kind[Filter by kind]:kind:(skill agent command mode system-prompt)'
        '-c[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile general)'
        '--category[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile general)'
        '-l[List available assets]'
        '--list[List available assets]'
        '-y[Skip confirmations]'
        '--yes[Skip confirmations]'
        '--json[Output in JSON format]'
        '--preview[Preview an asset]:asset:'
        '--no-animation[Skip startup animation]'
        '--dry-run[Show what would be installed without installing]'
    )

    _arguments -s \\
        \$options \\
        '1:command:(add list info doctor search targets models profile config run exec completions init uninstall update)' \\
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
complete -c vibe -s l -l list -d "List available assets"
complete -c vibe -l json -d "Output in JSON format"
complete -c vibe -l no-animation -d "Skip startup animation"
complete -c vibe -l dry-run -d "Show what would be installed without installing"

# Agent option — all 7 supported target CLIs
complete -c vibe -s a -l agent -d "Specify target CLI" -xa "opencode claude-code codex cursor gemini-cli copilot-cli factory-droid"

# Asset kind option
complete -c vibe -s k -l kind -d "Filter by asset kind" -xa "skill agent command mode system-prompt"

# Category option
complete -c vibe -s c -l category -d "Filter by category" -xa "development languages testing documentation security devops ai-ml web mobile general"

# Asset option (no completions, dynamic)
complete -c vibe -s s -l asset -d "Specify asset name"

# Preview option
complete -c vibe -l preview -d "Preview an asset"

# Subcommands
complete -c vibe -n "not __fish_seen_subcommand_from add list info doctor search targets models profile config run exec completions init uninstall update" -a "add list info doctor search targets models profile config run exec completions init uninstall update"

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
