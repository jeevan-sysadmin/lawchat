module.exports = {
  "extends": [
    "next/core-web-vitals",
    "plugin:import/recommended",
    "prettier"
  ],
  "rules": {
    "jsx-a11y/alt-text": "off",
    "react/display-name": "off",
    "react/no-children-prop": "off",
    "@next/next/no-img-element": "off",
    "@next/next/no-page-custom-font": "off",
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/parsers": {},
    "import/resolver": {
      "typescript": {
        "project": "./jsconfig.json"
      }
    }
  },
  "overrides": []
};
