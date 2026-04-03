import { Injectable } from '@nestjs/common';

export interface SchemaNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: string;
  description?: string;
}

export interface InstallationSchema {
  id: string;
  name: string;
  projectId?: string;
  imageUrl?: string;
  nodes: SchemaNode[];
}

@Injectable()
export class InstallationService {
  // In production: fetch from DB / S3
  private schemas: InstallationSchema[] = [
    {
      id: 'schema-1',
      name: 'Схема установки — Компрессорный блок',
      nodes: [
        { id: 'n1', label: 'Компрессор A1', x: 20, y: 30, type: 'compressor', description: 'Основной компрессор, 250 кВт' },
        { id: 'n2', label: 'Клапан В1', x: 45, y: 30, type: 'valve', description: 'Запорный клапан DN100' },
        { id: 'n3', label: 'Теплообменник T1', x: 70, y: 30, type: 'heat-exchanger', description: 'Пластинчатый т/о' },
        { id: 'n4', label: 'Насос P1', x: 45, y: 60, type: 'pump', description: 'Циркуляционный насос' },
      ],
    },
    {
      id: 'schema-2',
      name: 'Схема установки — Трубопроводная обвязка',
      nodes: [
        { id: 'n1', label: 'Ввод трубопровода', x: 10, y: 50, type: 'pipe-input' },
        { id: 'n2', label: 'Фильтр Ф1', x: 30, y: 50, type: 'filter', description: 'Магнитный фильтр' },
        { id: 'n3', label: 'Манометр M1', x: 50, y: 50, type: 'gauge' },
        { id: 'n4', label: 'Выход', x: 80, y: 50, type: 'pipe-output' },
      ],
    },
  ];

  findAll(projectId?: string): InstallationSchema[] {
    if (projectId) return this.schemas.filter(s => s.projectId === projectId);
    return this.schemas;
  }

  findOne(id: string): InstallationSchema | undefined {
    return this.schemas.find(s => s.id === id);
  }
}
