watchman watch ${PWD}

watchman -j <<-EOT
[
  "trigger",
  "${PWD}",
  {
    "name": "Auto run jsDoc",
    "expression": ["allof", ["match", "*.js"]],
    "command": [
      "npm", "run", "docs"
    ]
  }
]
EOT