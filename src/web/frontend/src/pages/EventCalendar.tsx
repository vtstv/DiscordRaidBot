// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/EventCalendar.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Event } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function EventCalendar() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (guildId) {
      api.getEvents(guildId)
        .then((data: Event[]) => setEvents(data))
        .finally(() => setLoading(false));
    }
  }, [guildId]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Event Calendar</h1>
              <p className="text-gray-600 dark:text-gray-400">View all events in calendar format</p>
            </div>
            <button
              onClick={() => navigate(`/guild/${guildId}/events/create`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          </div>

          {/* Calendar Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{monthName}</h2>
              
              <button
                onClick={() => changeMonth(1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 dark:border-purple-400'
                        : isToday
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isSelected || isToday ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs bg-purple-600 text-white rounded px-1 py-0.5 truncate"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Events on {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No events on this date</p>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map(event => (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/guild/${guildId}/events/${event.id}`)}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(event.startTime).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
                          {' • '}
                          {event.participants?.length || 0} participant{(event.participants?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </Layout>
  );
}
