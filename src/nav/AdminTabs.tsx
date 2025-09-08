// src/nav/AdminTabs.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import AttendanceScreen from '../screens/AttendanceScreen'
import InventoryScreen from '../screens/InventoryScreen'
import NoticesScreen from '../screens/NoticesScreen'

// Members
import MembersScreen from '../screens/MembersScreen'
import AssignPlanScreen from '../screens/members/AssignPlanScreen'

// Templates stack screens
import TemplateListScreen from '../screens/templates/TemplateListScreen'
import TemplateDetailScreen from '../screens/templates/TemplateDetailScreen'
import DayDetailScreen from '../screens/templates/DayDetailScreen'

// ---- Types for the Templates stack ----
export type TemplateStackParamList = {
  TemplateList: undefined
  TemplateDetail: { templateId: string; name: string }
  DayDetail: { dayId: string; name: string }
}

// ---- Types for the Members stack ----
export type MembersStackParamList = {
  MembersHome: undefined
  AssignPlan: { memberId: string; memberName: string }
}

const Tab = createBottomTabNavigator()
const TemplateStack = createNativeStackNavigator<TemplateStackParamList>()
const MembersStack = createNativeStackNavigator<MembersStackParamList>()

function TemplatesStackNav() {
  return (
    <TemplateStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0f1a' },
        headerTintColor: 'white',
      }}
    >
      <TemplateStack.Screen name="TemplateList" component={TemplateListScreen} options={{ title: 'Templates' }} />
      <TemplateStack.Screen name="TemplateDetail" component={TemplateDetailScreen} options={({ route }) => ({ title: route.params.name })} />
      <TemplateStack.Screen name="DayDetail" component={DayDetailScreen} options={({ route }) => ({ title: route.params.name })} />
    </TemplateStack.Navigator>
  )
}

function MembersStackNav() {
  return (
    <MembersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0f1a' },
        headerTintColor: 'white',
      }}
    >
      <MembersStack.Screen name="MembersHome" component={MembersScreen} options={{ title: 'Members' }} />
      <MembersStack.Screen name="AssignPlan" component={AssignPlanScreen} options={({ route }) => ({ title: `Assign • ${route.params.memberName}` })} />
    </MembersStack.Navigator>
  )
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0f1a' },
        headerTintColor: 'white',
        tabBarStyle: { backgroundColor: '#0b0f1a' },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#9aa4b2',
      }}
    >
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Members" component={MembersStackNav} options={{ headerShown: false }} />
      <Tab.Screen name="Templates" component={TemplatesStackNav} options={{ headerShown: false }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Notices" component={NoticesScreen} />
    </Tab.Navigator>
  )
}
