/**
 * Configuração global do Zod aplicada antes de qualquer schema ser criado.
 *
 * O Zod v4 tenta compilar validadores com `new Function("")`. Com o CSP ativo
 * (sem 'unsafe-eval') essa detecção falha em silêncio, porém o navegador
 * registra um aviso no console. Desligar o JIT explicitamente mantém o console
 * limpo e usa o caminho interpretado, compatível com a política.
 *
 * IMPORTANTE: este módulo deve ser importado ANTES dos módulos que criam
 * schemas (imports ESM são avaliados em ordem).
 */
import { config as configureZod } from "zod";

configureZod({ jitless: true });

export {};
