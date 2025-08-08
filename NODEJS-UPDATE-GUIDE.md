# Deployment Guide - Node.js 22 Compatibility

## 🚀 Node.js Version Update Summary

This project has been updated to use **Node.js 22** (latest LTS) with backward compatibility to Node.js 20.

### ✅ What's Been Updated

1. **Package Configuration**
   - Updated `@types/node` to `^22`
   - Added `engines` field specifying Node.js >=20.0.0
   - Added npm version requirement >=9.0.0

2. **Version Control Files**
   - Created `.nvmrc` with Node.js 22.16.0
   - Updated TypeScript target to ES2022
   - Enhanced Vercel config for Node.js 22 runtime

3. **Development Infrastructure**
   - Added Dockerfile with Node.js 22.16-alpine
   - Created GitHub Actions workflow with Node.js 20.x and 22.x matrix
   - Updated all setup scripts with Node.js version logging

4. **Documentation**
   - Updated README with Node.js prerequisites
   - Added version checking instructions
   - Enhanced deployment documentation

## 🔧 Local Development Setup

### Prerequisites Check
```bash
# Check your current Node.js version
node --version  # Should be 20.0.0 or higher
npm --version   # Should be 9.0.0 or higher

# If using nvm, switch to the project's Node.js version
nvm use
```

### Installation
```bash
# Install dependencies
npm ci

# Run development server
npm run dev
```

## 🚢 Deployment Options

### 1. Vercel (Recommended)
The project is configured for Vercel with Node.js 22 runtime:
```json
{
  "functions": {
    "app/api/**/*.js": { "runtime": "nodejs22.x" },
    "app/api/**/*.ts": { "runtime": "nodejs22.x" }
  }
}
```

### 2. Docker Deployment
```bash
# Build the Docker image
docker build -t aba-directory .

# Run the container
docker run -p 3000:3000 aba-directory
```

### 3. Traditional Hosting
Ensure your hosting provider supports:
- Node.js 20 or higher
- npm 9 or higher

## 🧪 Testing

The CI/CD pipeline tests against both Node.js 20 and 22:
```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]
```

## 🔍 Troubleshooting

### Node.js Version Issues
If you encounter version-related errors:

1. **Update Node.js**
   ```bash
   # Using nvm (recommended)
   nvm install 22.16.0
   nvm use 22.16.0
   
   # Or download from nodejs.org
   ```

2. **Clear npm cache**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verify TypeScript compatibility**
   ```bash
   npx tsc --noEmit
   ```

### Performance Scripts
All performance setup scripts now display the Node.js version:
```bash
# Will show: 🔧 Node.js Version: v22.16.0
node setup-performance-complete.mjs
```

## 📊 Performance Benefits

Node.js 22 brings several improvements:
- **Enhanced Performance**: Better V8 engine optimizations
- **Security Updates**: Latest security patches
- **Modern Features**: Support for latest ECMAScript features
- **Memory Efficiency**: Improved garbage collection

## 🛡️ Security Considerations

- Node.js 18 reached end-of-life maintenance
- Node.js 20 and 22 receive active security updates
- All dependencies updated for compatibility

## 🔄 Migration Notes

### For Existing Deployments
1. Update your hosting environment to Node.js 20+
2. Redeploy with new configuration
3. Test all functionality
4. Monitor performance metrics

### For Development Teams
1. Update local Node.js versions
2. Use `.nvmrc` for consistent environments
3. Update CI/CD pipelines
4. Test all development scripts

## 📚 Resources

- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0)
- [Next.js 15 Compatibility](https://nextjs.org/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
