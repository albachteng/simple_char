/**
 * Equipment Service
 * Frontend service for fetching equipment templates from the API
 */

import { logger } from '../logger';

export interface EquipmentTemplate {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'shield';
  subtype: string;
  description: string;
  base_ac_bonus: number;
  base_attack_bonus: number;
  base_damage_dice: string | null;
  str_requirement: number;
  dex_requirement: number;
  int_requirement: number;
  valid_slots: string[];
  conflicts_with: string[];
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

class EquipmentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * Get authentication headers with JWT token
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      logger.error('Equipment API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || 'Unknown error'
      });
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      logger.error('Equipment API returned error', { error: data.error, code: data.code });
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  }

  /**
   * Get all equipment templates
   * @param type Optional filter by equipment type
   */
  async getEquipmentTemplates(type?: string): Promise<{ templates: EquipmentTemplate[]; count: number }> {
    try {
      const url = type 
        ? `${this.baseUrl}/equipment/templates?type=${encodeURIComponent(type)}`
        : `${this.baseUrl}/equipment/templates`;

      logger.debug('Fetching equipment templates', { type, url });

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<{ templates: EquipmentTemplate[]; count: number }>(response);
      
      logger.info('Successfully fetched equipment templates', {
        count: result.count,
        type: type || 'all'
      });

      return result;

    } catch (error) {
      logger.error('Failed to fetch equipment templates', { error: (error as Error).message, type });
      throw error;
    }
  }

  /**
   * Get equipment template by ID
   */
  async getEquipmentTemplate(id: number): Promise<EquipmentTemplate> {
    try {
      logger.debug('Fetching equipment template by ID', { id });

      const response = await fetch(`${this.baseUrl}/equipment/templates/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<{ template: EquipmentTemplate }>(response);
      
      logger.info('Successfully fetched equipment template', {
        id,
        name: result.template.name,
        type: result.template.type
      });

      return result.template;

    } catch (error) {
      logger.error('Failed to fetch equipment template', { error: (error as Error).message, id });
      throw error;
    }
  }

  /**
   * Get equipment templates by type
   */
  async getEquipmentTemplatesByType(type: string): Promise<{ templates: EquipmentTemplate[]; type: string; count: number }> {
    try {
      logger.debug('Fetching equipment templates by type', { type });

      const response = await fetch(`${this.baseUrl}/equipment/templates/type/${encodeURIComponent(type)}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<{ templates: EquipmentTemplate[]; type: string; count: number }>(response);
      
      logger.info('Successfully fetched equipment templates by type', {
        type: result.type,
        count: result.count
      });

      return result;

    } catch (error) {
      logger.error('Failed to fetch equipment templates by type', { error: (error as Error).message, type });
      throw error;
    }
  }

  /**
   * Get weapons only
   */
  async getWeapons(): Promise<EquipmentTemplate[]> {
    const result = await this.getEquipmentTemplatesByType('weapon');
    return result.templates;
  }

  /**
   * Get armor only
   */
  async getArmor(): Promise<EquipmentTemplate[]> {
    const result = await this.getEquipmentTemplatesByType('armor');
    return result.templates;
  }

  /**
   * Get shields only
   */
  async getShields(): Promise<EquipmentTemplate[]> {
    const result = await this.getEquipmentTemplatesByType('shield');
    return result.templates;
  }
}

// Export singleton instance
export const equipmentService = new EquipmentService();