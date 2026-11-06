export default {
  extends: ['@commitlint/config-conventional'],
  // Dependabot writes long bodies that would fail the line-length rules.
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'songs',
        'bible',
        'media',
        'theme',
        'schedule',
        'live',
        'output',
        'render',
        'slides',
        'db',
        'ipc',
        'ui',
        'import',
        'settings',
        'deps'
      ]
    ]
  }
}
