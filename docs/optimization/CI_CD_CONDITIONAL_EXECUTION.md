# Conditional Execution Strategy

## Skip Conditions That Save CI Minutes

### 1. **Skip Mobile Build When Not Needed**

```yaml
mobile-build:
  if: |
    github.ref == 'refs/heads/main' || 
    contains(github.event.head_commit.message, '[mobile]') ||
    contains(github.event.pull_request.title, 'mobile') ||
    contains(github.event.head_commit.modified, 'capacitor.config.json') ||
    contains(github.event.head_commit.modified, 'android/') ||
    contains(github.event.head_commit.modified, 'src/utils/haptic')
```

### 2. **Skip Build If Only Documentation Changed**

```yaml
build:
  if: |
    !contains(github.event.head_commit.message, '[docs-only]') &&
    !startsWith(github.event.head_commit.message, 'docs:') &&
    !(github.event.pull_request.changed_files_count == 1 && contains(github.event.pull_request.changed_files[0], '.md'))
```

### 3. **Cache-Based Skipping**

```yaml
- name: Check if build needed
  id: check-build
  run: |
    if [ "${{ steps.build-cache.outputs.cache-hit }}" == "true" ]; then
      echo "build-needed=false" >> $GITHUB_OUTPUT
    else
      echo "build-needed=true" >> $GITHUB_OUTPUT
    fi

- name: Build application
  if: steps.check-build.outputs.build-needed == 'true'
  run: npm run build:production
```

### 4. **Dependency-Only Changes**

```yaml
# Skip tests if only package.json changed (dependency updates)
test:
  if: |
    !(
      github.event.commits[0].added == [] &&
      github.event.commits[0].removed == [] &&
      github.event.commits[0].modified == ['package.json', 'package-lock.json']
    )
```

## Environment-Specific Deployments

### Production

- **Trigger**: Push to `main` branch
- **Requirements**: All quality gates must pass
- **Features**: Full security scan, performance budget enforcement

### Staging

- **Trigger**: Push to `develop` branch  
- **Requirements**: Basic quality gates
- **Features**: Quick deployment for testing

### Preview

- **Trigger**: Pull requests
- **Requirements**: Build + basic tests only
- **Features**: Fast feedback for code review

## Performance Optimizations

### 1. **Parallel Matrix Builds**

```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]
    test-suite: [unit, integration]
  fail-fast: true  # Stop on first failure
```

### 2. **Dependency Caching Strategy**

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      node_modules/
      ~/.npm
      .vite/
      dist/
    key: deps-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('src/**/*') }}
    restore-keys: |
      deps-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}-
      deps-${{ runner.os }}-
```

### 3. **Build Artifact Reuse**

```yaml
# Build once, deploy multiple environments
build:
  outputs:
    build-artifact: build-files-${{ github.sha }}

deploy-staging:
  needs: build
  steps:
    - uses: actions/download-artifact@v4
      with:
        name: ${{ needs.build.outputs.build-artifact }}
```
