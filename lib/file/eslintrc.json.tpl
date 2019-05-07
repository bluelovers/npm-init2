{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "plugin:@typescript-eslint/recommended"
  ],
  "env": {
    "browser": true,
    "node": true
  },
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "eol-last": [
      "error",
      "always"
    ],
    "no-compare-neg-zero": [
      "error"
    ],
    "no-dupe-args": [
      "error"
    ],
    "no-dupe-keys": [
      "error"
    ],
    "no-duplicate-case": [
      "error"
    ],
    "no-empty-character-class": [
      "error"
    ],
    "no-ex-assign": [
      "error"
    ],
    "no-extra-semi": [
      "error"
    ],
    "no-extra-bind": [
      "error"
    ],
    "no-extra-label": [
      "error"
    ],
    "no-extend-native": [
      "error"
    ],
    "camelcase": "off",
    "semi": "off",
    "@typescript-eslint/semi": [
      "error"
    ],
    "@typescript-eslint/camelcase": [
      "warn"
    ],
    "no-floating-decimal": [
      "error"
    ],
    "@typescript-eslint/unbound-method": [
      "error"
    ],
    "@typescript-eslint/indent": [
      "off"
    ],
    "@typescript-eslint/restrict-plus-operands": [
      "warn"
    ],
    "@typescript-eslint/member-naming": [
      "warn"
    ],
    "@typescript-eslint/require-array-sort-compare": [
      "warn"
    ],
    "@typescript-eslint/member-ordering": [
      "warn"
    ],
    "@typescript-eslint/prefer-includes": [
      "warn"
    ],
    "@typescript-eslint/no-useless-constructor": [
      "warn"
    ],
    "@typescript-eslint/interface-name-prefix": [
      "error",
      "always"
    ],
    "@typescript-eslint/promise-function-async": [
      "error",
      {
        "allowedPromiseNames": [
          "Thenable"
        ]
      }
    ]
  }
}
