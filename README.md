# GitHub Enterprise MCP Server

An MCP (Model Context Protocol) server for integration with GitHub Enterprise API. This server provides an MCP interface to easily access repository information, issues, PRs, and more from GitHub Enterprise in Cursor.

## Compatibility

This project is primarily designed for GitHub Enterprise Server environments, but it also works with:
- GitHub.com
- GitHub Enterprise Cloud

> **Note**: Some enterprise-specific features (like license information and enterprise statistics) will not work with GitHub.com or GitHub Enterprise Cloud.

## Key Features

- Retrieve repository list from GitHub Enterprise instances
- Get detailed repository information
- List repository branches
- View file and directory contents
- Manage issues and pull requests
- Repository management (create, update, delete)
- GitHub Actions workflows management
- Access enterprise statistics
- Enhanced error handling and user-friendly response formatting

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Access to a GitHub Enterprise instance
- Personal Access Token (PAT)

### Installation and Setup

#### Option 1: Using npx (Recommended)

The easiest way to use GitHub Enterprise MCP is via npx:

```bash
npx @ddukbg/github-enterprise-mcp --token=your_github_token --github-enterprise-url=https://github.your-company.com/api/v3
```

#### Option 2: Manual Installation

1. Set up environment variables:

```bash
# GitHub Enterprise API URL
export GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3"

# GitHub Personal Access Token
export GITHUB_TOKEN="your_personal_access_token"
```

2. Install packages:

```bash
npm install
```

3. Build:

```bash
npm run build
```

4. Start the server:

```bash
# STDIO mode (direct integration with Cursor)
npm start

# HTTP mode (for debugging)
node dist/index.js --transport http
```

## Integration with AI Tools

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "npx",
      "args": ["-y", "@ddukbg/github-enterprise-mcp", "--token=YOUR_GITHUB_TOKEN", "--github-enterprise-url=YOUR_GITHUB_ENTERPRISE_URL"]
    }
  }
}
```

Replace `YOUR_GITHUB_TOKEN` and `YOUR_GITHUB_ENTERPRISE_URL` with your actual values.

### Cursor

In Cursor, you can add this MCP server in the settings:

1. Open Cursor and go to **Settings**
2. Navigate to **AI > MCP Servers**
3. Click **Add MCP Server**
4. Enter the following details:
   - **Name**: GitHub Enterprise
   - **Command**: `npx`
   - **Arguments**: `-y @ddukbg/github-enterprise-mcp --token=YOUR_GITHUB_TOKEN --github-enterprise-url=YOUR_GITHUB_ENTERPRISE_URL`

Replace `YOUR_GITHUB_TOKEN` and `YOUR_GITHUB_ENTERPRISE_URL` with your actual values.

## Additional Options in HTTP Mode

- `--debug`: Enable debug logging
- `--github-enterprise-url <URL>`: Set GitHub Enterprise API URL
- `--token <TOKEN>`: Set GitHub Personal Access Token

## Available MCP Tools

This MCP server provides the following tools:

| Tool Name | Description | Parameters | Required PAT Permissions |
|---|---|---|---|
| `list-repositories` | Retrieve repository list for a user or organization | `owner`: Username/org name<br>`isOrg`: Whether it's an organization<br>`type`: Repository type<br>`sort`: Sort criteria<br>`page`: Page number<br>`perPage`: Items per page | `repo` |
| `get-repository` | Get detailed repository information | `owner`: Repository owner<br>`repo`: Repository name | `repo` |
| `list-branches` | List branches of a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`protected_only`: Whether to show only protected branches<br>`page`: Page number<br>`perPage`: Items per page | `repo` |
| `get-content` | Retrieve file or directory contents | `owner`: Repository owner<br>`repo`: Repository name<br>`path`: File/directory path<br>`ref`: Branch/commit (optional) | `repo` |
| `list-pull-requests` | List pull requests in a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`state`: PR state filter<br>`sort`: Sort criteria<br>`direction`: Sort direction<br>`page`: Page number<br>`per_page`: Items per page | `repo` |
| `get-pull-request` | Get pull request details | `owner`: Repository owner<br>`repo`: Repository name<br>`pull_number`: Pull request number | `repo` |
| `create-pull-request` | Create a new pull request | `owner`: Repository owner<br>`repo`: Repository name<br>`title`: PR title<br>`head`: Head branch<br>`base`: Base branch<br>`body`: PR description<br>`draft`: Create as draft PR | `repo` |
| `merge-pull-request` | Merge a pull request | `owner`: Repository owner<br>`repo`: Repository name<br>`pull_number`: Pull request number<br>`merge_method`: Merge method<br>`commit_title`: Commit title<br>`commit_message`: Commit message | `repo` |
| `list-issues` | List issues in a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`state`: Issue state filter<br>`sort`: Sort criteria<br>`direction`: Sort direction<br>`page`: Page number<br>`per_page`: Items per page | `repo` |
| `get-issue` | Get issue details | `owner`: Repository owner<br>`repo`: Repository name<br>`issue_number`: Issue number | `repo` |
| `create-issue` | Create a new issue | `owner`: Repository owner<br>`repo`: Repository name<br>`title`: Issue title<br>`body`: Issue body content<br>`labels`: Array of label names<br>`assignees`: Array of user logins<br>`milestone`: Milestone ID | `repo` |
| `create-repository` | Create a new repository | `name`: Repository name<br>`description`: Repository description<br>`private`: Whether private<br>`auto_init`: Initialize with README<br>`gitignore_template`: Add .gitignore<br>`license_template`: Add license<br>`org`: Organization name | `repo` |
| `update-repository` | Update repository settings | `owner`: Repository owner<br>`repo`: Repository name<br>`description`: New description<br>`private`: Change privacy<br>`default_branch`: Change default branch<br>`has_issues`: Enable/disable issues<br>`has_projects`: Enable/disable projects<br>`has_wiki`: Enable/disable wiki<br>`archived`: Archive/unarchive | `repo` |
| `delete-repository` | Delete a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`confirm`: Confirmation (must be true) | `delete_repo` |
| `list-workflows` | List GitHub Actions workflows | `owner`: Repository owner<br>`repo`: Repository name<br>`page`: Page number<br>`perPage`: Items per page | `actions:read` |
| `list-workflow-runs` | List workflow runs | `owner`: Repository owner<br>`repo`: Repository name<br>`workflow_id`: Workflow ID/filename<br>`branch`: Filter by branch<br>`status`: Filter by status<br>`page`: Page number<br>`perPage`: Items per page | `actions:read` |
| `trigger-workflow` | Trigger a workflow | `owner`: Repository owner<br>`repo`: Repository name<br>`workflow_id`: Workflow ID/filename<br>`ref`: Git reference<br>`inputs`: Workflow inputs | `actions:write` |
| `get-license-info` | Get GitHub Enterprise license information **(Requires Classic PAT)** | - | `admin:enterprise` |
| `get-enterprise-stats` | Get GitHub Enterprise system statistics **(Requires Classic PAT)** | - | `admin:enterprise` |

> **Note**: For Enterprise-specific tools (`get-license-info` and `get-enterprise-stats`), a **Classic Personal Access Token** with `admin:enterprise` scope is required. Fine-grained tokens do not support these Enterprise-level permissions.

## API Improvements

- Flexible API URL configuration (supports various environment variables and command-line arguments)
- Enhanced error handling and timeout management
- User-friendly response formatting and messages

## License

ISC 