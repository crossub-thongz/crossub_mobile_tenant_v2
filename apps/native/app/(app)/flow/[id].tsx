import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';
import { Text } from 'react-native';

import { HouseholdScreen, DocumentsScreen, NotificationSettingsScreen, PersonalScreen, PropertiesScreen, SecurityScreen, TenancyScreen } from '@/src/flows/account';
import { CleaningScreen, FinalScreen, KeysScreen, RenewalScreen, SettlementScreen, VacatingScreen } from '@/src/flows/lifecycle';
import { CompletedChatScreen, ConversationScreen, CrosScreen, NewMessageScreen, NotificationsScreen } from '@/src/flows/messages';
import { InvoicesScreen, LedgerScreen, ReceiptsScreen, RentDetailsScreen } from '@/src/flows/money';
import {
  AppointmentScreen,
  EntryScreen,
  InspectionScreen,
  InspectionsScreen,
  MaintenanceScreen,
  OpenInspectionScreen,
  ReportScreen,
  RescheduleScreen,
  SelfInspectionScreen,
} from '@/src/flows/operations';
import { Screen } from '@/src/ui/ui';

const screens: Record<string, ComponentType> = {
  inspection: InspectionScreen,
  reschedule: RescheduleScreen,
  inspections: InspectionsScreen,
  entry: EntryScreen,
  'open-inspection': OpenInspectionScreen,
  'self-inspection': SelfInspectionScreen,
  report: ReportScreen,
  maintenance: MaintenanceScreen,
  appointment: AppointmentScreen,
  renewal: RenewalScreen,
  keys: KeysScreen,
  vacating: VacatingScreen,
  cleaning: CleaningScreen,
  final: FinalScreen,
  settlement: SettlementScreen,
  ledger: LedgerScreen,
  'rent-details': RentDetailsScreen,
  invoices: InvoicesScreen,
  receipts: ReceiptsScreen,
  cros: CrosScreen,
  'new-message': NewMessageScreen,
  conversation: ConversationScreen,
  'completed-chat': CompletedChatScreen,
  notifications: NotificationsScreen,
  properties: PropertiesScreen,
  tenancy: TenancyScreen,
  documents: DocumentsScreen,
  household: HouseholdScreen,
  personal: PersonalScreen,
  'notification-settings': NotificationSettingsScreen,
  security: SecurityScreen,
};

export default function FlowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const key = Array.isArray(id) ? id[0] : id;
  const ScreenForId = key ? screens[key] : undefined;
  if (!ScreenForId) {
    return (
      <Screen>
        <Text>This screen is not available.</Text>
      </Screen>
    );
  }
  return <ScreenForId />;
}
