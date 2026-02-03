
# Deluna Ops - Design System

## Color Palette
- **Primary**: `#1B4332` (`deluna-primary`) - Cor principal, usada em headers, sidebars e elementos de destaque.
- **Primary Light**: `#2D6A4F` (`deluna-primary-light`) - Tons secundários de verde.
- **Accent**: `#40916C` (`deluna-accent`) - Sucesso, bordas de navegação ativa e ícones positivos.
- **Teal**: `#2C7A7B` (`deluna-teal`) - Usado para linhas de tendência e elementos informativos.
- **Gold**: `#C5A059` (`deluna-gold`) - Rankings, medalhas e prêmios.
- **Alert/Danger**: `#BC4749` - Insucessos, quedas de performance e alertas críticos.
- **Background**: `#F8FAFC` - Fundo neutro das páginas.

## Typography
- **Display**: `Plus Jakarta Sans` - Uso obrigatório em títulos de páginas e nomes de seções (Geralmente em `font-black` ou `font-extrabold`).
- **Interface**: `Inter` - Uso em tabelas, labels de filtros e textos de suporte.
- **Metrics**: `Manrope` - Usado opcionalmente em números grandes de dashboards executivos.

## Component Standards

### Tables
- **Header**: Fundo `deluna-primary`, texto branco, fonte 10px ou 11px, `font-black`, uppercase com `tracking-widest`.
- **Rows**: Alternância de cores (`bg-white` / `bg-slate-50`), hover com leve transparência do verde primário.
- **Variance Column**: Sempre com fundo preto (`bg-black`) ou cinza muito escuro para contraste máximo da métrica comparativa.

### Cards (Metric Cards)
- Fundo branco, borda `slate-200`, sombra suave (`shadow-sm`).
- Valor principal em `text-3xl font-extrabold`.
- Badge de variação com fundo leve (ex: `bg-green-100`) e texto forte.

### Sidebar
- Background fixo `deluna-primary`.
- Item ativo com `bg-white/10` e borda esquerda `deluna-accent`.
- Texto em `font-medium` ou `font-bold` (ativo).
