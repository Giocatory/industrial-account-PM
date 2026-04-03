import { Injectable } from '@nestjs/common';

@Injectable()
export class ContactsService {
  getTeam() {
    return [
      {
        id: '1',
        name: 'Алексей Петров',
        position: 'Руководитель отдела',
        email: 'a.petrov@company.ru',
        phone: '+7 (495) 123-45-67',
        photo: null,
      },
      {
        id: '2',
        name: 'Мария Иванова',
        position: 'Старший менеджер',
        email: 'm.ivanova@company.ru',
        phone: '+7 (495) 123-45-68',
        photo: null,
      },
      {
        id: '3',
        name: 'Дмитрий Сидоров',
        position: 'Инженер-конструктор',
        email: 'd.sidorov@company.ru',
        phone: '+7 (495) 123-45-69',
        photo: null,
      },
    ];
  }

  getCompanyContacts() {
    return {
      phone: '+7 (495) 100-00-00',
      email: 'info@company.ru',
      address: 'г. Москва, ул. Промышленная, д. 1',
      workingHours: 'Пн–Пт: 9:00–18:00 (МСК)',
      telegram: '@company_support',
    };
  }
}
