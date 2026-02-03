
import { RawDeliveryRow, DeliveryData } from '../types';

// URL fixa por enquanto, o usuário deve substituir depois ou configurar via .env
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxyVb9TMALRPhF5ir1h_A6DY3w03F8H88owvGz4d_oTaYzVv_y3oPOSL9LTu26IS_DGng/exec';

const CACHE_KEY = 'delivery_data_cache_v5';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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

        const rawData: RawDeliveryRow[] = await response.json();

        if (!Array.isArray(rawData)) {
            console.error("Formato de resposta inválido", rawData);
            return [];
        }

        const processedData = rawData
            .filter(row => row.Motorista && row.Remessas !== "" && row.Remessas !== undefined)
            .map(row => {
                const atQuantity = Number(row.Remessas) || 0;
                const delivered = Number(row.Entregues) || 0;

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

                return {
                    date: row.Date ? String(row.Date).split('T')[0] : '',
                    id: String(row.ID || 'S/ID'),
                    driver: row.Motorista,
                    hub: String(row.Bases || 'S/H'),
                    coordinator: String(row.Coordenador || 'S/C'),
                    atCode: String(row.AT || ''),
                    atQuantity: atQuantity,
                    failures: Math.max(0, atQuantity - delivered),
                    delivered: delivered,
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
