
import { DeliveryData, QLPData, MetaGoalData, MetaDSData, MetaCaptacaoData, MetaProtagonismoData, ProtagonismoRow, PNRRow, AccessData } from '../types';

// URL fixa por enquanto, o usuário deve substituir depois ou configurar via .env
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyVb9TMALRPhF5ir1h_A6DY3w03F8H88owvGz4d_oTaYzVv_y3oPOSL9LTu26IS_DGng/exec';

const CACHE_KEY = 'delivery_data_cache_v5';
const QLP_CACHE_KEY = 'qlp_data_cache_v2';
const METAS_CACHE_KEY = 'metas_data_cache_v2';
const METAS_DS_CACHE_KEY = 'metas_ds_data_cache_v1';
const METAS_CAPTACAO_CACHE_KEY = 'metas_captacao_data_cache_v1';
const METAS_PROTAGONISMO_CACHE_KEY = 'metas_protagonismo_data_cache_v1';
const ACESSOS_CACHE_KEY = 'acessos_data_cache_v1';
const PNR_CACHE_KEY = 'pnr_data_cache_v4';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 horas

/**
 * Limpa todos os caches locais do sistema para forçar uma nova busca no Google Sheets.
 */
export const clearApiCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(QLP_CACHE_KEY);
    localStorage.removeItem(METAS_CACHE_KEY);
    localStorage.removeItem(METAS_DS_CACHE_KEY);
    localStorage.removeItem(METAS_CAPTACAO_CACHE_KEY);
    localStorage.removeItem(METAS_PROTAGONISMO_CACHE_KEY);
    localStorage.removeItem(ACESSOS_CACHE_KEY);
    localStorage.removeItem(PNR_CACHE_KEY);
    console.log("Caches limpos com sucesso!");
};

// --- HELPER FUNCTIONS ---
export const getVal = (row: any, ...keys: string[]) => {
    const rowKeys = Object.keys(row);
    const normalize = (s: string) => s.toUpperCase().replace(/[\s_|-]/g, '');

    for (const k of keys) {
        const normalizedK = normalize(k);
        const found = rowKeys.find(rk => normalize(rk) === normalizedK);
        if (found) return row[found];
    }
    return '';
};

export const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return NaN;
    if (typeof val === 'number') return val;

    // Remove caracteres não numéricos, exceto dítigos, vírgula, ponto e sinal de menos
    let clean = String(val).replace(/[^\d.,-]/g, '').trim();

    // Se houver vírgula, tratamos como formato brasileiro/europeu (vírgula decimal)
    // Ex: "1.234,56" -> remove o ponto de milhar e troca vírgula por ponto
    if (clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};
// ------------------------

export const fetchDeliveryData = async (url: string = GOOGLE_SCRIPT_URL): Promise<DeliveryData[]> => {
    try {
        // 1. Verificar Cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log("Usando dados em cache");
                return data;
            }
        }

        // 2. Buscar da API (Removendo limit para pegar todos e filtrar no front)
        const response = await fetch(`${url}?tab=Base_Rotas_2026`);
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.statusText}`);
        }

        const rawData: any[] = await response.json();

        if (!Array.isArray(rawData)) {
            console.error("Formato de resposta inválido", rawData);
            return [];
        }

        const processedData = rawData
            .filter(row => row.Motorista && row.Remessas !== "" && row.Remessas !== undefined)
            .map(row => {
                const atQuantity = parseNum(getVal(row, 'Remessas', 'QTD_AT', 'QUANTIDADE')) || 0;
                const delivered = parseNum(getVal(row, 'Entregues', 'ENTREGUE', 'DELIVERED')) || 0;
                const pending = parseNum(getVal(row, 'Pendentes', 'PENDENTE', 'PENDING')) || 0;

                let rate = 0;
                if (atQuantity > 0) {
                    rate = (delivered / atQuantity) * 100;
                    rate = Math.round(rate * 10) / 10;
                }

                let status: DeliveryData['status'] = 'ABAIXO DA META';
                if (rate > 97.99) {
                    status = 'META ALCANÇADA';
                } else if (rate > 94.99) {
                    status = 'PRÓX DA META';
                } else {
                    status = 'ABAIXO DA META';
                }

                // Normalizar data (YYYY-MM-DD ou DD/MM/YYYY)
                let rawDate = String(getVal(row, 'Date', 'DATA') || '');
                let formattedDate = '';
                if (rawDate.includes('T')) {
                    formattedDate = rawDate.split('T')[0];
                } else if (rawDate.includes('/')) {
                    // Tenta converter DD/MM/YYYY para YYYY-MM-DD
                    const parts = rawDate.split('/');
                    if (parts.length === 3) {
                        const [d, m, y] = parts;
                        formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    } else {
                        formattedDate = rawDate;
                    }
                } else {
                    formattedDate = rawDate;
                }

                return {
                    date: formattedDate,
                    id: String(getVal(row, 'ID') || 'S/ID'),
                    driver: String(getVal(row, 'Motorista', 'DRIVER') || 'S/M'),
                    hub: String(getVal(row, 'Bases', 'BASE', 'HUB') || 'S/H'),
                    coordinator: String(getVal(row, 'Coordenador', 'COORD', 'SUPERVISOR') || 'S/C'),
                    leader: String(getVal(row, 'Lider', 'LIDER', 'LEADER') || ''),
                    locality: String(getVal(row, 'Localidade', 'LOCAL', 'CIDADE') || ''),
                    atCode: String(getVal(row, 'AT', 'COD_AT') || ''),
                    atQuantity: atQuantity,
                    failures: Math.max(0, atQuantity - delivered),
                    delivered: delivered,
                    pending: pending,
                    successRate: rate,
                    status: status
                };
            })
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA;
            });


        // 3. Salvar no Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: processedData,
            timestamp: Date.now()
        }));

        return processedData;

    } catch (error) {
        console.error("Falha ao buscar dados de delivery:", error);
        return [];
    }
};

const fetchBaseMetadata = async (url: string = GOOGLE_SCRIPT_URL): Promise<{ metadataMap: Map<string, { coord: string; lider: string; localidade: string }>; normalizeBase: (s: string) => string }> => {
    try {
        const response = await fetch(`${url}?tab=${encodeURIComponent('Lista de Bases')}`);
        if (!response.ok) return { metadataMap: new Map(), normalizeBase: (s: string) => s };
        const rawBases = await response.json();
        if (!Array.isArray(rawBases)) return { metadataMap: new Map(), normalizeBase: (s: string) => s };

        const metadataMap = new Map();
        const normalizeBase = (s: string) => String(s || '').toUpperCase().replace(/[\s_|-]/g, '').replace(/^LAJ/, 'LRJ');

        rawBases.forEach(row => {
            const rawBase = String(getVal(row, 'BASES', 'BASE') || '');
            const normalizedBase = normalizeBase(rawBase);
            if (normalizedBase) {
                metadataMap.set(normalizedBase, {
                    coord: String(getVal(row, 'Supervisor | Coordenador', 'SUP / COORD', 'SUP/COORD', 'COORDENADOR', 'COORD', 'SUPERVISOR') || ''),
                    lider: String(getVal(row, 'LÍDER ATUAL', 'LIDER ATUAL', 'LÍDER', 'LIDER', 'LEADER') || ''),
                    localidade: String(getVal(row, 'LOCALIDADE', 'LOCAL', 'CIDADE', 'HUB') || '')
                });
            }
        });
        return { metadataMap, normalizeBase };
    } catch (error) {
        console.error("Erro ao buscar metadados de bases:", error);
        return { metadataMap: new Map(), normalizeBase: (s: string) => s };
    }
};

export const fetchMetasData = async (url: string = GOOGLE_SCRIPT_URL): Promise<MetaGoalData[]> => {
    try {
        const cached = localStorage.getItem(METAS_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        const response = await fetch(`${url}?tab=Metas`);
        if (!response.ok) throw new Error(`Erro na API Metas: ${response.statusText}`);

        const rawData: any[] = await response.json();
        const processed = rawData.map(row => ({
            base: String(getVal(row, 'BASES') || '').trim(),
            periodo: String(getVal(row, 'PERÍODO', 'Periodo') || '').trim(),
            tipoMeta: Number(getVal(row, 'TIPO_META', 'Tipo_Meta') || 0),
            valorMetaDia: parseNum(getVal(row, 'VALOR_META_DIA', 'Valor_Meta_dia') || 0),
            valorPremio: parseNum(getVal(row, 'VALOR_PREMIO', 'Valor_Premio') || 0)
        }));

        localStorage.setItem(METAS_CACHE_KEY, JSON.stringify({
            data: processed,
            timestamp: Date.now()
        }));

        return processed;
    } catch (error) {
        console.error("Erro ao carregar Metas:", error);
        return [];
    }
};

export const fetchMetasDSData = async (url: string = GOOGLE_SCRIPT_URL): Promise<MetaDSData[]> => {
    try {
        const cached = localStorage.getItem(METAS_DS_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        const response = await fetch(`${url}?tab=Metas_DS`);
        if (!response.ok) throw new Error(`Erro na API Metas_DS: ${response.statusText}`);

        const rawData: any[] = await response.json();
        const processed = rawData.map(row => {
            let metaVal = parseNum(getVal(row, 'VALOR_META_DS', 'Valor_Meta_DS') || 0);
            // Se a meta vier como decimal (ex: 0.99 para 99%), normaliza para escala 0-100
            if (metaVal > 0 && metaVal <= 1) metaVal *= 100;

            return {
                base: String(getVal(row, 'BASES') || '').trim(),
                tipoMeta: Number(getVal(row, 'TIPO_META', 'Tipo_Meta') || 0),
                valorMetaDS: metaVal,
                valorPremio: parseNum(getVal(row, 'VALOR_PREMIO', 'Valor_Premio') || 0)
            };
        });

        localStorage.setItem(METAS_DS_CACHE_KEY, JSON.stringify({
            data: processed,
            timestamp: Date.now()
        }));

        return processed;
    } catch (error) {
        console.error("Erro ao carregar Metas_DS:", error);
        return [];
    }
};

export const fetchMetasCaptacaoData = async (url: string = GOOGLE_SCRIPT_URL): Promise<MetaCaptacaoData[]> => {
    try {
        const cached = localStorage.getItem(METAS_CAPTACAO_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        const response = await fetch(`${url}?tab=Metas_Captacao`);
        if (!response.ok) throw new Error(`Erro na API Metas_Captacao: ${response.statusText}`);

        const rawData: any[] = await response.json();
        const processed = rawData.map(row => ({
            base: String(getVal(row, 'BASES') || '').trim(),
            valorMetaQLP: parseNum(getVal(row, 'VALOR_META_QLP', 'Valor_Meta_QLP') || 0),
            valorPremio: parseNum(getVal(row, 'VALOR_PREMIO', 'Valor_Premio') || 0)
        }));

        localStorage.setItem(METAS_CAPTACAO_CACHE_KEY, JSON.stringify({
            data: processed,
            timestamp: Date.now()
        }));

        return processed;
    } catch (error) {
        console.error("Erro ao carregar Metas_Captacao:", error);
        return [];
    }
};

export const fetchMetaProtagonismoData = async (url: string = GOOGLE_SCRIPT_URL): Promise<MetaProtagonismoData[]> => {
    try {
        const cached = localStorage.getItem(METAS_PROTAGONISMO_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        const response = await fetch(`${url}?tab=Metas_Protagonismo`);
        if (!response.ok) throw new Error(`Erro na API Metas_Protagonismo: ${response.statusText}`);

        const rawData: any[] = await response.json();
        const processed = rawData.map(row => ({
            base: String(getVal(row, 'BASES') || '').trim(),
            periodo: String(getVal(row, 'PERIDO', 'PERÍODO', 'MES', 'MÊS', 'PERIODO') || '').trim(),
            tipoMeta: Number(getVal(row, 'TIPO_META', 'Tipo_Meta') || 0),
            valorMetaProtagonismo: parseNum(getVal(row, 'VALOR_META_PROTAGONISMO', 'Valor_Meta_Protagonismo') || 0),
            valorPremio: parseNum(getVal(row, 'VALOR_PREMIO', 'Valor_Premio') || 0)
        }));

        localStorage.setItem(METAS_PROTAGONISMO_CACHE_KEY, JSON.stringify({
            data: processed,
            timestamp: Date.now()
        }));

        return processed;
    } catch (error) {
        console.error("Erro ao carregar Metas_Protagonismo:", error);
        return [];
    }
};

export const fetchQLPData = async (url: string = GOOGLE_SCRIPT_URL): Promise<QLPData[]> => {
    try {
        const cached = localStorage.getItem(QLP_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        // OTIMIZAÇÃO: Dispara os dois requests em paralelo
        const [{ metadataMap, normalizeBase }, response] = await Promise.all([
            fetchBaseMetadata(url),
            fetch(`${url}?tab=QLP`)
        ]);

        if (!response.ok) throw new Error(`Erro na API QLP: ${response.statusText}`);

        const rawData: any[] = await response.json();

        const processed = rawData
            .filter(row => {
                const cliente = String(getVal(row, 'Q CLENTE', 'CLIENTE') || '').toUpperCase().trim();
                const base = String(getVal(row, 'BASE') || '').toUpperCase().trim();

                const isShopee = cliente === 'SHOPEE';
                const isNotBonsucesso = !base.includes('XPT BONSUCESSO');

                return isShopee && isNotBonsucesso;
            })
            .map(row => {
                const baseName = String(getVal(row, 'BASE') || '');
                const normalizedBaseName = normalizeBase(baseName);
                const metadata = metadataMap.get(normalizedBaseName);

                return {
                    base: baseName,
                    placa: String(getVal(row, 'PLACA') || ''),
                    nome: String(getVal(row, 'NOME') || ''),
                    situacaoCnh: String(getVal(row, 'SITUAÇÃO CNH', 'CNH') || ''),
                    situacaoMotorista: String(getVal(row, 'SITUAÇÃO MOTORISTA', 'MOTORISTA') || ''),
                    tipoVeiculo: String(getVal(row, 'TIPO DO VEÍCULO', 'TIPO VEICULO') || ''),
                    situacaoGrPlaca: String(getVal(row, 'SITUAÇÃO GR PLACA', 'GR PLACA') || ''),
                    cliente: String(getVal(row, 'Q CLENTE', 'CLIENTE') || ''),
                    coordenador: metadata ? metadata.coord : ''
                };
            });

        localStorage.setItem(QLP_CACHE_KEY, JSON.stringify({
            data: processed,
            timestamp: Date.now()
        }));

        return processed;
    } catch (error) {
        console.error("Erro ao carregar QLP:", error);
        return [];
    }
};

export const fetchProtagonismoData = async (url: string = GOOGLE_SCRIPT_URL): Promise<any[]> => {
    try {
        // OTIMIZAÇÃO: Usa o novo recurso do Script para trazer as duas abas em um único request (Batching)
        const tabs = encodeURIComponent('Lista de Bases,Respostas');
        const batchUrl = `${url}?tabs=${tabs}`;
        console.log("DEBUG Protagonismo: Iniciando batch fetch...", batchUrl);

        const res = await fetch(batchUrl);
        if (!res.ok) throw new Error(`Erro HTTP ao buscar dados do Protagonismo: ${res.status}`);

        const result = await res.json();
        const rawBases = result['Lista de Bases'];
        const rawNotes = result['Respostas'];

        if (!Array.isArray(rawBases)) {
            throw new Error(`Aba 'Lista de Bases' não retornou uma lista válida.`);
        }

        const baseList = rawBases.map(row => ({
            base: String(getVal(row, 'BASES', 'BASE') || ''),
            coord: String(getVal(row, 'Supervisor | Coordenador', 'SUP / COORD', 'SUP/COORD', 'COORDENADOR', 'COORD', 'SUPERVISOR') || ''),
            lider: String(getVal(row, 'LÍDER ATUAL', 'LIDER ATUAL', 'LÍDER', 'LIDER', 'LEADER') || ''),
            localidade: String(getVal(row, 'LOCALIDADE', 'LOCAL', 'CIDADE', 'HUB') || ''),
            avatar: String(getVal(row, 'AVATAR', 'FOTO', 'URL') || ''),
            _raw_debug: row
        })).filter(b => b.base && b.base !== 'undefined');

        // 3. Agrupar notas por base (média)
        const notesMap = new Map<string, { sum: number, count: number }>();
        if (Array.isArray(rawNotes)) {
            rawNotes.forEach((row) => {
                // Tenta pegar a base (geralmente a pergunta de qual é a base)
                const baseRaw = getVal(row, 'BASE_OP', 'BASE', 'BASES', 'QUAL A SUA BASE', 'QUAL A BASE');
                const base = String(baseRaw || '').toUpperCase().trim();

                // Tenta pegar a nota
                const rawNota = getVal(row, 'NOTA_PROTAGONISMO', 'NOTA PROTAGONISMO', 'NOTA', 'PONTUAÇÃO', 'PONTOS');
                const nota = parseNum(rawNota);

                if (base && !isNaN(nota)) {
                    if (!notesMap.has(base)) notesMap.set(base, { sum: 0, count: 0 });
                    const current = notesMap.get(base)!;
                    current.sum += nota;
                    current.count += 1;
                }
            });
        }

        // 4. Combinar Bases com Médias
        return baseList.map(b => {
            const stats = notesMap.get(b.base.toUpperCase().trim());
            const avg = stats ? stats.sum / stats.count : 0;
            return {
                ...b,
                resultado: avg,
                _debug_count: stats ? stats.count : 0 // Adicionado para debug
            };
        });

    } catch (error: any) {
        console.error("Erro ao carregar Protagonismo:", error);
        throw error; // Repassar para o componente tratar
    }
};

export const fetchAccessData = async (url: string = GOOGLE_SCRIPT_URL): Promise<AccessData[]> => {
    try {
        const cached = localStorage.getItem(ACESSOS_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        const response = await fetch(`${url}?tab=Acessos`);
        if (!response.ok) throw new Error(`Erro na API Acessos: ${response.statusText}`);

        const rawData: any[] = await response.json();
        const accessInfos = rawData
            .filter(row => {
                const email = String(getVal(row, 'E_MAIL', 'EMAIL', 'E-MAIL') || '');
                return email !== '' && email.includes('@');
            })
            .map(row => ({
                email: String(getVal(row, 'E_MAIL', 'EMAIL', 'E-MAIL') || '').toLowerCase().trim(),
                user: String(getVal(row, 'USUARIOS', 'USUARIO', 'USER', 'NOME', 'USUÁRIO', 'USUÁRIOS') || '').trim()
            }));

        localStorage.setItem(ACESSOS_CACHE_KEY, JSON.stringify({
            data: accessInfos,
            timestamp: Date.now()
        }));

        return accessInfos;
    } catch (error) {
        console.error("Erro ao carregar dados de acesso:", error);
        return [];
    }
};

export const fetchAllowedEmails = async (url: string = GOOGLE_SCRIPT_URL): Promise<string[]> => {
    const data = await fetchAccessData(url);
    return data.map(item => item.email);
};

export const fetchPNRData = async (url: string = GOOGLE_SCRIPT_URL): Promise<PNRRow[]> => {
    try {
        const cached = localStorage.getItem(PNR_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        const response = await fetch(`${url}?tab=Base_PNR`);
        if (!response.ok) {
            throw new Error(`Erro na API PNR: ${response.statusText}`);
        }

        const rawData: any[] = await response.json();

        if (!Array.isArray(rawData)) {
            console.error("Formato de resposta PNR inválido", rawData);
            return [];
        }

        const processedData = rawData
            .filter(row => {
                const driver = getVal(row, 'Motorista', 'DRIVER', 'Nome do motorista');
                const tracking = getVal(row, 'SPX Tracking Number', 'TRACKING', 'ID', 'Tracking');
                return driver && tracking;
            })
            .map((row, index) => {
                // Prioridade absoluta para DATA DA ROTA
                let rawDate = String(getVal(row, 'DATA DA ROTA') || getVal(row, 'DATA') || getVal(row, 'Date') || '');
                let formattedDate = '';

                if (rawDate.includes('T')) {
                    formattedDate = rawDate.split('T')[0];
                } else if (rawDate.includes('/')) {
                    const parts = rawDate.split('/');
                    if (parts.length === 3) {
                        let [d, m, y] = parts;
                        if (y.length === 2) y = '20' + y;
                        formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    } else if (parts.length === 2) {
                        // Caso venha apenas DD/MM, assume o ano atual
                        const [d, m] = parts;
                        const y = new Date().getFullYear();
                        formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    } else {
                        formattedDate = rawDate;
                    }
                } else {
                    formattedDate = rawDate;
                }

                if (index === 0) {
                    console.log("PNR Data Sample:", {
                        raw: rawDate,
                        formatted: formattedDate,
                        keys: Object.keys(row)
                    });
                }

                return {
                    date: formattedDate,
                    driver: String(getVal(row, 'Motorista', 'DRIVER', 'Nome do motorista') || '').trim(),
                    base: String(getVal(row, 'Base', 'BASES', 'HUB') || '').trim(),
                    trackingNumber: String(getVal(row, 'SPX Tracking Number', 'TRACKING', 'ID') || '').trim(),
                    statusShopee: String(getVal(row, 'Status Shopee', 'STATUS') || '').trim()
                };
            });

        localStorage.setItem(PNR_CACHE_KEY, JSON.stringify({
            data: processedData,
            timestamp: Date.now()
        }));

        return processedData;

    } catch (error) {
        console.error("Falha ao buscar dados de PNR:", error);
        return [];
    }
};
