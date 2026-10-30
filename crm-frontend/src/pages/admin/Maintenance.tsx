import React from 'react';
import AppointmentsPage, { type AppointmentsPageProps } from './Appointments';

export default function MaintenancePage(props: AppointmentsPageProps) {
  return <AppointmentsPage {...props} moduleType="maintenance" />;
}
