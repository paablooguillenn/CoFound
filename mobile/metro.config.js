// Metro config para npm workspaces.
// Al estar dentro de un workspace (raíz: C:\CoFound), las dependencias se
// hoistean a `<root>/node_modules`. Metro por defecto solo mira en
// `mobile/node_modules`, así que hay que decirle dónde buscar.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar todo el monorepo (no solo mobile/).
config.watchFolders = [workspaceRoot];

// 2. Indicar a Metro las dos rutas de node_modules — la del workspace primero,
//    la del root después.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Evitar lookups jerárquicos para que Metro no se confunda con
//    node_modules anidados.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
