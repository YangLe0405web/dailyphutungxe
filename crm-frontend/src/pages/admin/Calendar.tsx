import React from 'react';
import AppointmentsPage, { type AppointmentsPageProps } from './Appointments';

export default function CalendarPage(props: AppointmentsPageProps) {
  return <AppointmentsPage {...props} moduleType="calendar" />;
}
