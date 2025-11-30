declare module 'babbage-sdk' {
  export function getPublicKey(options?: any): Promise<string>;
  const _default: any;
  export default _default;
}

{
  "compilerOptions": {
    "typeRoots": ["src/types", "node_modules/@types"]
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/types/**/*.d.ts"
  ]
}

