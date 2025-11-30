# Running the client (Expo)

If you want to run the Expo app from the `client/` directory, this project includes a minimal `package.json` in this folder so `npx expo start` works here.

Commands (run inside `client/`):

```powershell
cd "D:\LAZY\Coding Practices\GymApp\client"
npx expo start
```

Notes:
- If the project dependencies are installed only at the repo root, you may still need to run `npm install` or `pnpm install` in this `client/` folder to create `node_modules` locally.
- Alternatively, you can start Expo at the repo root (where the main `package.json` is) using `npx expo start` — this is often the simplest approach.

If you'd like, I can add npm workspace configuration so dependencies are centralized at the root and `client/` can run without duplicate installs — say the word and I'll set it up.

Fix added: this repository now includes a small `client/App.tsx` that re-exports the top-level `App` from the repository root. That means if you run `npx expo start` inside the `client/` folder, Expo's default entry file (`node_modules/expo/AppEntry.js`) can resolve `App` and the bundler should no longer show the "Unable to resolve '../../App'" error.
