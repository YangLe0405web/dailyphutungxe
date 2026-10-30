import React from 'react';
import AppointmentsPage, { type AppointmentsPageProps } from './Appointments';

export default function TestDrivesPage(props: AppointmentsPageProps) {
  return <AppointmentsPage {...props} moduleType="test-drives" />;
}
