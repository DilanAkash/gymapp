Missing asset errors (e.g. "Asset not found: client/assets/icon.png"):

This project includes `client/app.json` that points to workspace root `../assets/*` files so you shouldn't need to copy image files manually.

Expo Go SDK mismatch (e.g. "installed version of Expo Go is for SDK 54 but the project uses SDK 53"):

If you see this, restart Expo and clear cache or run the project from the repo root where `package.json` declares Expo SDK 54.0.x. Example:

```powershell
# start from repo root (recommended)
cd "D:\LAZY\Coding Practices\GymApp"
npx expo start -c

# or, if running from client/, make sure client/ has compatible SDK and node_modules
cd "D:\LAZY\Coding Practices\GymApp\client"
npm install
npx expo start -c
```

If you'd like, the repo can be updated to use a workspace setup so dependencies are centralized at the root (preventing duplicate installs).