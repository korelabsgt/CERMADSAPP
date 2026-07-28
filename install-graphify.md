####################################################################################

## Guía rápida de Graphify para cursor

####################################################################################

---

## Primera vez (Instalación completa)

1. Instalar el gestor (uv):
   curl -LsSf https://astral.sh/uv/install.sh | sh

(Cierra y abre una nueva terminal en Cursor)

2. Instalar Graphify:
   uv tool install graphifyy

3. Analizar el proyecto actual:
   graphify . --code-only --ignore "node_modules, .next, dist, public"

4. Conectar con Cursor:
   graphify cursor install

---

## En un proyecto nuevo o diferente

Solo abres la terminal en la carpeta de ese proyecto y ejecutas:

1. Analizar el nuevo proyecto:
   graphify . --code-only --ignore "node_modules, .next, dist, public"

2. Conectar con Cursor:
   graphify cursor install

---

## Mantenimiento

Cada vez que el código o la estructura de un proyecto cambie, solo ejecuta:
graphify . --code-only --ignore "node_modules, .next, dist, public"

####################################################################################

## Guía rápida de Graphify para Google Antigravity

####################################################################################

---

## Primera vez en Antigravity

1. Analizar el proyecto actual:
   graphify . --code-only --ignore "node_modules, .next, dist, public"

2. Conectar con Antigravity:
   graphify antigravity install

---

## En un proyecto nuevo o diferente

1. Analizar el nuevo proyecto:
   graphify . --code-only --ignore "node_modules, .next, dist, public"

2. Conectar con Antigravity:
   graphify antigravity install

---

## Mantenimiento

Cada vez que el código o la estructura de un proyecto cambie, solo ejecuta:
graphify . --code-only --ignore "node_modules, .next, dist, public"
