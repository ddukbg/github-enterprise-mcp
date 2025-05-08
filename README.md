[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/containerelic-github-enterprise-mcp-badge.png)](https://mseep.ai/app/containerelic-github-enterprise-mcp)

# GitHub Enterprise MCP Server

![image](https://github.com/user-attachments/assets/55403caa-c81d-486a-8ec7-3a2532e7545e)

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
- User management (list, create, update, delete, suspend/unsuspend users)
- Access enterprise statistics
- Enhanced error handling and user-friendly response formatting

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Access to a GitHub Enterprise instance
- Personal Access Token (PAT)

### Docker Installation and Setup

#### Option 1: Running with Docker

1. Build the Docker image:

    ```bash
    docker build -t github-enterprise-mcp .
    ```

2. Run the Docker container with environment variables:

    ```bash
    docker run -p 3000:3000 \
      -e GITHUB_TOKEN="your_github_token" \
      -e GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3" \
      -e DEBUG=true \
      github-enterprise-mcp
    ```

> **Note**: The Dockerfile is configured to run with `--transport http` by default. If you need to change this, you can override the command:

```bash
docker run -p 3000:3000 \
  -e GITHUB_TOKEN="your_github_token" \
  -e GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3" \
  -e DEBUG=true \
  github-enterprise-mcp node dist/index.js --transport http --debug
```

#### Option 2: Using Docker Compose

1. Create a `.env` file in the project root with the required environment variables:

    ```shell
    GITHUB_ENTERPRISE_URL=https://github.your-company.com/api/v3
    GITHUB_TOKEN=your_github_token
    DEBUG=true
    ```

2. Start the container with Docker Compose:

    ```bash
    docker-compose up -d
    ```

3. Check the logs:

    ```bash
    docker-compose logs -f
    ```

4. Stop the container:

    ```bash
    docker-compose down
    ```

### Installation and Setup

#### Local Development (Using Concurrent Mode)

This method is recommended for active development with automatic recompilation and server restarts:

1. Clone the repository and install required packages:

    ```bash
    git clone https://github.com/ddukbg/github-enterprise-mcp.git
    cd github-enterprise-mcp
    npm install
    ```

2. Run the development server:

    ```bash
    export GITHUB_TOKEN="your_github_token"
    export GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3"
    npm run dev
    ```

    This will:
    - Compile TypeScript code automatically when files change
    - Restart the server when compiled files are updated
    - Run the server in HTTP mode for URL-based connections

3. Connect to Cursor using URL mode as described below

### Installation and Setup for Production

#### Option 1: Using URL Mode (Recommended for Local Development)

This method is the most stable and recommended for local development or testing:

1. Clone the repository and install required packages:

    ```bash
    git clone https://github.com/ddukbg/github-enterprise-mcp.git
    cd github-enterprise-mcp
    npm install
    ```

2. Build the project:

    ```bash
    npm run build
    chmod +x dist/index.js
    ```

3. Run the server:

    ```bash
    export GITHUB_TOKEN="your_github_token"
    export GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3"
    node dist/index.js --transport http --debug
    ```

4. Connect to Cursor using URL mode:
   - Add the following to your Cursor's `.cursor/mcp.json` file:

   ```json
   {
     "mcpServers": {
       "github-enterprise": {
         "url": "http://localhost:3000/sse"
       }
     }
   }
   ```

#### Option 2: Install as a Global Command (npm link)

This method is useful for local development:

```bash
# After cloning the repository
git clone https://github.com/ddukbg/github-enterprise-mcp.git
cd github-enterprise-mcp

# Install required packages
npm install

# Build
npm run build
chmod +x dist/index.js

# Link globally
npm link

# Run as a global command
export GITHUB_TOKEN="your_github_token"
export GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3"
github-enterprise-mcp --transport=http --debug
```

#### Option 3: Using npx (When Package is Published)

If the package is published to the public npm registry:

```bash
npx @ddukbg/github-enterprise-mcp --token=your_github_token --github-enterprise-url=https://github.your-company.com/api/v3
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

#### Recommended: URL Mode (Most Stable)

For the most reliable operation in Cursor, using URL mode is recommended:

1. Start the server in a separate terminal window:

   ```bash
   cd /path/to/github-enterprise-mcp
   GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3" GITHUB_TOKEN="your_github_token" node dist/index.js --transport http
   ```

2. Configure Cursor's MCP settings:
   - Open Cursor and go to **Settings**
   - Navigate to **AI > MCP Servers**
   - Edit your `.cursor/mcp.json` file:

   ```json
   {
     "mcpServers": {
       "github-enterprise": {
         "url": "http://localhost:3000/sse"
       }
     }
   }
   ```

3. Restart Cursor to apply the changes

#### Alternative: Command Mode

Alternatively, you can configure Cursor to use the command mode, although URL mode is more reliable:

1. Open Cursor and go to **Settings**
2. Navigate to **AI > MCP Servers**
3. Click **Add MCP Server**
4. Enter the following details:
   - **Name**: GitHub Enterprise
   - **Command**: `npx`
   - **Arguments**: `@ddukbg/github-enterprise-mcp`
   - **Environment Variables**:
     - `GITHUB_ENTERPRISE_URL`: Your GitHub Enterprise API URL
     - `GITHUB_TOKEN`: Your GitHub personal access token

Alternatively, you can manually edit your `.cursor/mcp.json` file to include:

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "npx",
      "args": [
        "@ddukbg/github-enterprise-mcp"
      ],
      "env": {
        "GITHUB_ENTERPRISE_URL": "https://github.your-company.com/api/v3",
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

## Language Configuration

This MCP server supports both English and Korean languages. You can configure the language using:

### Environment Variables

```bash
# Set language to Korean
export LANGUAGE=ko

# Or in .env file
LANGUAGE=ko
```

### Command-line Arguments

```bash
# Set language to Korean
node dist/index.js --language ko
```

The default language is English if not specified.

## Additional Options in HTTP Mode

- `--debug`: Enable debug logging
- `--github-enterprise-url <URL>`: Set GitHub Enterprise API URL
- `--token <TOKEN>`: Set GitHub Personal Access Token
- `--language <LANG>`: Set language (en or ko, default: en)

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
| `list-issue-comments` | List comments on an issue or pull request | `owner`: Repository owner<br>`repo`: Repository name<br>`issue_number`: Issue/PR number<br>`page`: Page number<br>`per_page`: Items per page | `repo` |
| `create-issue` | Create a new issue | `owner`: Repository owner<br>`repo`: Repository name<br>`title`: Issue title<br>`body`: Issue body content<br>`labels`: Array of label names<br>`assignees`: Array of user logins<br>`milestone`: Milestone ID | `repo` |
| `create-repository` | Create a new repository | `name`: Repository name<br>`description`: Repository description<br>`private`: Whether private<br>`auto_init`: Initialize with README<br>`gitignore_template`: Add .gitignore<br>`license_template`: Add license<br>`org`: Organization name | `repo` |
| `update-repository` | Update repository settings | `owner`: Repository owner<br>`repo`: Repository name<br>`description`: New description<br>`private`: Change privacy<br>`default_branch`: Change default branch<br>`has_issues`: Enable/disable issues<br>`has_projects`: Enable/disable projects<br>`has_wiki`: Enable/disable wiki<br>`archived`: Archive/unarchive | `repo` |
| `delete-repository` | Delete a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`confirm`: Confirmation (must be true) | `delete_repo` |
| `list-workflows` | List GitHub Actions workflows | `owner`: Repository owner<br>`repo`: Repository name<br>`page`: Page number<br>`perPage`: Items per page | `actions:read` |
| `list-workflow-runs` | List workflow runs | `owner`: Repository owner<br>`repo`: Repository name<br>`workflow_id`: Workflow ID/filename<br>`branch`: Filter by branch<br>`status`: Filter by status<br>`page`: Page number<br>`perPage`: Items per page | `actions:read` |
| `trigger-workflow` | Trigger a workflow | `owner`: Repository owner<br>`repo`: Repository name<br>`workflow_id`: Workflow ID/filename<br>`ref`: Git reference<br>`inputs`: Workflow inputs | `actions:write` |
| `get-license-info` | Get GitHub Enterprise license information | - | **Requires site_admin (Administrator) account** |
| `get-enterprise-stats` | Get GitHub Enterprise system statistics | - | **Requires site_admin (Administrator) account** |

> **Note**: For Enterprise-specific tools (`get-license-info` and `get-enterprise-stats`), a user with **site administrator** privileges is required. A Classic Personal Access Token is recommended, as Fine-grained tokens may not support these Enterprise-level permissions.

## Using the Tools in Cursor

Once you have set up the MCP server and configured Cursor to connect to it, you can use the GitHub Enterprise tools directly in Cursor's AI chat. Here are some examples:

### Listing Repositories

```js
mcp_github_enterprise_list_repositories(owner="octocat")
```

### Getting Repository Information

```js
mcp_github_enterprise_get_repository(owner="octocat", repo="hello-world")
```

### Listing Pull Requests

```js
mcp_github_enterprise_list_pull_requests(owner="octocat", repo="hello-world", state="open")
```

### Managing Issues

```js
# List issues
mcp_github_enterprise_list_issues(owner="octocat", repo="hello-world", state="all")
# Get issue details
mcp_github_enterprise_get_issue(owner="octocat", repo="hello-world", issue_number=1)

# Get issue/PR comments
mcp_github_enterprise_list_issue_comments(owner="octocat", repo="hello-world", issue_number=1)


# Create a new issue
mcp_github_enterprise_create_issue(
  owner="octocat", 
  repo="hello-world",
  title="Found a bug",
  body="Here is a description of the bug",
  labels=["bug", "important"]
)
```

### Working with Repository Content

```js
mcp_github_enterprise_get_content(owner="octocat", repo="hello-world", path="README.md")
```

### Repository Management

```
# Create a new repository
mcp_github_enterprise_create_repository(
  name="new-project",
  description="This is a new project",
  private=true,
  auto_init=true
)

# Update repository settings
mcp_github_enterprise_update_repository(
  owner="octocat",
  repo="hello-world",
  description="Updated description",
  has_issues=true
)
```

### User Management (Enterprise Only)

These features are specifically designed for GitHub Enterprise Server environments and require administrative permissions:

```js
# List all users in the GitHub Enterprise instance
mcp_github_enterprise_list_users(filter="active", per_page=100)

# Get a specific user's details
mcp_github_enterprise_get_user(username="octocat")

# Create a new user (Enterprise only)
mcp_github_enterprise_create_user(
  login="newuser",
  email="newuser@example.com",
  name="New User",
  company="ACME Inc."
)

# Update a user's information (Enterprise only)
mcp_github_enterprise_update_user(
  username="octocat",
  email="updated-email@example.com",
  location="San Francisco"
)

# Suspend a user (Enterprise only)
mcp_github_enterprise_suspend_user(
  username="octocat",
  reason="Violation of terms of service"
)

# Unsuspend a user (Enterprise only)
mcp_github_enterprise_unsuspend_user(username="octocat")

# List organizations a user belongs to
mcp_github_enterprise_list_user_orgs(username="octocat")
```

## API Improvements

- Flexible API URL configuration (supports various environment variables and command-line arguments)
- Enhanced error handling and timeout management
- User-friendly response formatting and messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
