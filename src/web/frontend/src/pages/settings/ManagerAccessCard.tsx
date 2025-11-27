// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/settings/ManagerAccessCard.tsx
// Manager & Access settings card

import { GuildSettings, DiscordRole } from '../../services/api';
import { RolePermissionsMap } from './types';
import { InfoIcon } from './icons';

interface ManagerAccessCardProps {
  settings: GuildSettings;
  setSettings: (settings: GuildSettings) => void;
  roles: DiscordRole[];
  rolePermissions: RolePermissionsMap;
  setRolePermissions: (permissions: RolePermissionsMap) => void;
}

export default function ManagerAccessCard({ 
  settings, 
  setSettings, 
  roles, 
  rolePermissions, 
  setRolePermissions 
}: ManagerAccessCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 Manager & Access</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              Manager Role
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                @Manager
              </span>
            </label>
            <select 
              value={settings.managerRoleId || ''} 
              onChange={e => setSettings({...settings, managerRoleId: e.target.value || undefined})}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="">-- No manager role --</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  @{role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              Dashboard Access Roles
              <InfoIcon onClick={() => alert('Select roles that can access the dashboard. If empty, only managers can access.')} />
            </label>
            <div className="space-y-2">
              {/* Current dashboard roles list */}
              {(settings.dashboardRoles || []).length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current roles:</div>
                  <div className="flex flex-wrap gap-2">
                    {(settings.dashboardRoles || []).map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      return (
                        <span key={roleId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">
                          @{role?.name || 'Unknown'}
                          <button
                            type="button"
                            onClick={() => {
                              const current = settings.dashboardRoles || [];
                              setSettings({...settings, dashboardRoles: current.filter(id => id !== roleId)});
                              
                              // Remove permissions for this role
                              const newPerms = {...rolePermissions};
                              delete newPerms[roleId];
                              setRolePermissions(newPerms);
                            }}
                            className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add role */}
              <div className="flex gap-2">
                <select
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  defaultValue=""
                >
                  <option value="" disabled>Select role to add</option>
                  {roles
                    .filter(role => !(settings.dashboardRoles || []).includes(role.id))
                    .map(role => (
                      <option key={role.id} value={role.id}>
                        @{role.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={(e) => {
                    const select = e.currentTarget.previousElementSibling as HTMLSelectElement;
                    const roleId = select.value;
                    if (roleId) {
                      const current = settings.dashboardRoles || [];
                      setSettings({...settings, dashboardRoles: [...current, roleId]});
                      
                      // Initialize default permissions for this role if not already set
                      if (!rolePermissions[roleId]) {
                        setRolePermissions({
                          ...rolePermissions,
                          [roleId]: {
                            canAccessEvents: true,
                            canAccessCompositions: true,
                            canAccessTemplates: true,
                            canAccessSettings: false,
                          }
                        });
                      }
                      
                      select.value = '';
                    }
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Clear all button */}
              {(settings.dashboardRoles || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSettings({...settings, dashboardRoles: []});
                    setRolePermissions({}); // Clear all permissions
                  }}
                  className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 rounded-xl transition-colors text-sm"
                >
                  Clear all roles
                </button>
              )}

              {/* Role Permissions */}
              {(settings.dashboardRoles || []).length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    🔒 Module Access Permissions
                  </div>
                  <div className="space-y-3">
                    {(settings.dashboardRoles || []).map(roleId => {
                      const role = roles.find(r => r.id === roleId);
                      const perms = rolePermissions[roleId] || {
                        canAccessEvents: true,
                        canAccessCompositions: true,
                        canAccessTemplates: true,
                        canAccessSettings: false,
                      };

                      return (
                        <div key={roleId} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                            @{role?.name || 'Unknown'}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canAccessEvents}
                                onChange={(e) => {
                                  setRolePermissions({
                                    ...rolePermissions,
                                    [roleId]: { ...perms, canAccessEvents: e.target.checked }
                                  });
                                }}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-gray-700 dark:text-gray-300">📅 Events</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canAccessCompositions}
                                onChange={(e) => {
                                  setRolePermissions({
                                    ...rolePermissions,
                                    [roleId]: { ...perms, canAccessCompositions: e.target.checked }
                                  });
                                }}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-gray-700 dark:text-gray-300">⚔️ Compositions</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canAccessTemplates}
                                onChange={(e) => {
                                  setRolePermissions({
                                    ...rolePermissions,
                                    [roleId]: { ...perms, canAccessTemplates: e.target.checked }
                                  });
                                }}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-gray-700 dark:text-gray-300">📋 Templates</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perms.canAccessSettings}
                                onChange={(e) => {
                                  setRolePermissions({
                                    ...rolePermissions,
                                    [roleId]: { ...perms, canAccessSettings: e.target.checked }
                                  });
                                }}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-gray-700 dark:text-gray-300">⚙️ Settings</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    💡 Manager role has full access to all modules regardless of these settings
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
