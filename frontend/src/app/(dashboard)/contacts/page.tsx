'use client';

import { useQuery } from '@tanstack/react-query';
import { contactsApi } from '@/lib/api';
import { Phone, Mail, MapPin, Clock, Send, User } from 'lucide-react';

export default function ContactsPage() {
  const { data: team } = useQuery({ queryKey: ['team'], queryFn: () => contactsApi.getTeam().then(r => r.data) });
  const { data: company } = useQuery({ queryKey: ['company'], queryFn: () => contactsApi.getCompany().then(r => r.data) });

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Контакты</h1>

      {/* Company contacts */}
      {company && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Общие контакты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 shrink-0 opacity-80" />
              <div>
                <p className="text-xs opacity-70">Телефон</p>
                <p className="font-medium">{company.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 shrink-0 opacity-80" />
              <div>
                <p className="text-xs opacity-70">Email</p>
                <a href={`mailto:${company.email}`} className="font-medium hover:underline">{company.email}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0 opacity-80" />
              <div>
                <p className="text-xs opacity-70">Режим работы</p>
                <p className="font-medium">{company.workingHours}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 shrink-0 opacity-80" />
              <div>
                <p className="text-xs opacity-70">Адрес</p>
                <p className="font-medium">{company.address}</p>
              </div>
            </div>
          </div>
          {company.telegram && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
              <Send className="w-4 h-4 opacity-70" />
              <span className="text-sm opacity-80">Telegram: <span className="font-medium">{company.telegram}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Team */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Команда</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team?.map((member: any) => (
            <div key={member.id} className="bg-white border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-blue-600 mb-2">{member.position}</p>
                <div className="space-y-1">
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                      <Phone className="w-3 h-3" /> {member.phone}
                    </a>
                  )}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                      <Mail className="w-3 h-3" /> {member.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
