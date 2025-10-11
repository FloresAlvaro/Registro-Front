# 🐕 Husky Git Hooks

Este proyecto utiliza Husky para automatizar tareas de calidad de código antes de commits y push.

## 🔧 Hooks Configurados

### Pre-commit

- **Archivo**: `.husky/pre-commit`
- **Acción**: Ejecuta `lint-staged`
- **Función**:
  - Lint y corrige archivos TypeScript y HTML
  - Formatea código con Prettier
  - Solo procesa archivos en staging

### Pre-push

- **Archivo**: `.husky/pre-push`
- **Acción**: Ejecuta `npm run test:ci`
- **Función**: Ejecuta todas las pruebas unitarias antes del push

### Commit-msg

- **Archivo**: `.husky/commit-msg`
- **Acción**: Valida formato de mensajes de commit
- **Formato requerido**: `tipo(scope): descripción`
- **Tipos válidos**:
  - `feat`: Nueva funcionalidad
  - `fix`: Corrección de bug
  - `docs`: Documentación
  - `style`: Formato/estilo de código
  - `refactor`: Refactorización
  - `test`: Pruebas
  - `chore`: Tareas de mantenimiento
  - `build`: Sistema de build
  - `ci`: Integración continua
  - `perf`: Mejoras de rendimiento
  - `revert`: Revertir cambios

## 📝 Ejemplos de Commits Válidos

```bash
git commit -m "feat: add user authentication"
git commit -m "fix(auth): resolve login bug"
git commit -m "docs: update README"
git commit -m "style: format code with prettier"
git commit -m "refactor(components): extract common logic"
git commit -m "test: add unit tests for auth service"
git commit -m "chore: update dependencies"
```

## 🚀 Scripts NPM Relacionados

```bash
# Ejecutar linting
npm run lint

# Ejecutar linting con corrección automática
npm run lint:fix

# Formatear código
npm run format

# Verificar formato sin cambios
npm run format:check

# Ejecutar pre-commit manualmente
npm run pre-commit

# Validación completa (lint + format + tests)
npm run validate
```

## ⚙️ Configuración

### Lint-staged

- **Archivo**: `.lintstagedrc.json`
- **Funciona solo con archivos en staging**
- **Optimiza el tiempo de ejecución**

### Saltar Hooks (No Recomendado)

Si necesitas saltar los hooks temporalmente:

```bash
# Saltar pre-commit
git commit --no-verify -m "mensaje"

# Saltar pre-push
git push --no-verify
```

⚠️ **Nota**: Solo usar en emergencias, ya que se saltea las validaciones de calidad.

## 🛠️ Troubleshooting

### Error: "Husky command not found"

```bash
npm run prepare
```

### Error: "lint-staged command not found"

```bash
npm install
```

### Regenerar hooks

```bash
rm -rf .husky
npx husky init
# Luego recrear los archivos de hooks
```
