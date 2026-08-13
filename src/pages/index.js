"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const jsx_runtime_1 = require("react/jsx-runtime");
const Layout_1 = __importDefault(require("@theme/Layout"));
const Link_1 = __importDefault(require("@docusaurus/Link"));
const useDocusaurusContext_1 = __importDefault(require("@docusaurus/useDocusaurusContext"));
const Translate_1 = __importStar(require("@docusaurus/Translate"));
function Home() {
    const { siteConfig } = (0, useDocusaurusContext_1.default)();
    return ((0, jsx_runtime_1.jsx)(Layout_1.default, { title: `${siteConfig.title} Documentation`, description: (0, Translate_1.translate)({
            id: 'homepage.description',
            message: 'Self-hosted open-source financial data infrastructure API',
        }), children: (0, jsx_runtime_1.jsxs)("main", { style: { padding: '4rem 2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }, children: [(0, jsx_runtime_1.jsx)("img", { src: "/img/logo.png", alt: "Fonrex Logo", style: { width: '120px', height: '120px', borderRadius: '24px', marginBottom: '1rem' } }), (0, jsx_runtime_1.jsx)("h1", { style: { fontSize: '3rem', fontWeight: 800, color: 'var(--ifm-color-primary)' }, children: siteConfig.title }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '1.4rem', opacity: 0.85, margin: '1.5rem 0' }, children: (0, jsx_runtime_1.jsx)(Translate_1.default, { id: "homepage.tagline", children: "Open-source financial data infrastructure" }) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }, children: [(0, jsx_runtime_1.jsx)(Link_1.default, { className: "button button--primary button--lg", to: "/docs/intro", children: (0, jsx_runtime_1.jsx)(Translate_1.default, { id: "homepage.button.getStarted", children: "Get Started" }) }), (0, jsx_runtime_1.jsx)(Link_1.default, { className: "button button--secondary button--lg", to: "/docs/api-reference/assets", children: (0, jsx_runtime_1.jsx)(Translate_1.default, { id: "homepage.button.apiReference", children: "API Reference" }) })] })] }) }));
}
