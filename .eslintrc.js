module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended", // <- will be added soon
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:prettier/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "tsconfigRootDir": __dirname,
        "sourceType": "module"
    },
    "plugins": [
        "eslint-plugin-import",
        "eslint-plugin-jsdoc",
        "eslint-plugin-prefer-arrow",
        "@typescript-eslint",
    ],
    "root": true,
    "ignorePatterns": [
        "node_modules",
        "build",
        "dist",
        "public",
        "/src/_versions.ts",
        "*.js",
        "*.test.ts",
        "/src/core/__test"
    ],
    "rules": {
        "prettier/prettier": "warn",
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "array-simple"
            }
        ],
        "@typescript-eslint/ban-types": [
            "error",
            {
                "types": {
                    "Object": {
                        "message": "Avoid using the `Object` type. Did you mean `object`?"
                    },
                    "Function": {
                        "message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
                    },
                    "Boolean": {
                        "message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
                    },
                    "Number": {
                        "message": "Avoid using the `Number` type. Did you mean `number`?"
                    },
                    "String": {
                        "message": "Avoid using the `String` type. Did you mean `string`?"
                    },
                    "Symbol": {
                        "message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
                    }
                }
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/dot-notation": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-member-accessibility": [
            "error",
            {
                "accessibility": "explicit",
            }
        ],
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/indent": [
            "off",
            2,
            {
                "FunctionDeclaration": {
                    "parameters": "first"
                },
                "FunctionExpression": {
                    "parameters": "first",
                },
                "SwitchCase": 1,
            }
        ],
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/member-ordering": [
            "warn",
            { "classes": [ "signature", "field", "constructor", ["set", "get"], "method" ] },
        ],
        "@typescript-eslint/naming-convention": [
            "off",
            {
                selector: 'default',
                format: ['snake_case', 'camelCase'], // Make it more strict
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },

            {
                selector: 'variable',
                format: ['camelCase', 'snake_case'],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'allow',
            },

            {
                selector: 'typeLike',
                format: ['PascalCase'],
            },
        ],
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-shadow": [
            "warn",
            {
                "hoist": "all"
            }
        ],
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": [
            "off",
            "single"
        ],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/triple-slash-reference": [
            "error",
            {
                "path": "always",
                "types": "prefer-import",
                "lib": "always"
            }
        ],
        /** Большинство из этих ворнингов должны быть ошибками */
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/typedef": "off",
        "@typescript-eslint/unified-signatures": "error",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/unbound-method": "warn",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-this-alias": "warn",
        "@typescript-eslint/no-misused-promises": "warn",
        "@typescript-eslint/await-thenable": "warn",
        "@typescript-eslint/restrict-plus-operands": "warn",
        "@typescript-eslint/no-floating-promises": "warn",
        "arrow-body-style": "error",
        "arrow-parens": [
            "error",
            "always"
        ],
        "brace-style": [
            "off",
            "1tbs"
        ],
        "comma-dangle": [
            "error",
            "always-multiline"
        ],
        "complexity": "off",
        "constructor-super": "error",
        "curly": "error",
        "dot-notation": "off",
        "eol-last": "error",
        "eqeqeq": [
            "off",
            "always"
        ],
        "guard-for-in": "error",
        "id-denylist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "error",
        "import/order": [
            "warn",
            {
                alphabetize: {
                    order: 'asc', /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */
                    caseInsensitive: true /* ignore case. Options: [true, false] */
                }
            }
        ],
        "indent": "off",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "warn",
        "jsdoc/newline-after-description": "error",
        "max-classes-per-file": "off",
        "max-len": [
            "warn",
            {
                "code": 120,
            }
        ],
        "new-parens": "error",
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "warn",
        "no-debugger": "error",
        "no-empty": "off",
        "no-empty-function": "off",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-multiple-empty-lines": "error",
        "no-new-wrappers": "error",
        "no-shadow": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-useless-escape": "off",
        "no-unsafe-finally": "error",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-use-before-define": "off",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": [
            "error",
            "never"
        ],
        "prefer-arrow/prefer-arrow-functions": "off",
        "prefer-const": "error",
        "quote-props": [
            "off",
            "consistent-as-needed"
        ],
        "quotes": "off",
        "radix": "error",
        "semi": "error",
        "space-before-function-paren": "off",
        "spaced-comment": [
            "error",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "use-isnan": "error",
        "valid-typeof": "off",
        // "@typescript-eslint/tslint/config": [
        //     "error",
        //     {
        //         "rules": {
        //             "import-spacing": true,
        //             "whitespace": [
        //                 true,
        //                 "check-branch",
        //                 "check-decl",
        //                 "check-operator",
        //                 "check-separator",
        //                 "check-type",
        //                 "check-typecast"
        //             ]
        //         }
        //     }
        // ]
    }
};
