import { useApp } from '../context/AppContext';
import { Users, Shield, User, Tag, Check } from 'lucide-react';

export default function UsersPage() {
  const { users, brands } = useApp();

  const staffUsers = users.filter(u => u.role === 'staff');
  const managerUsers = users.filter(u => u.role === 'manager');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kelola Staff</h1>
        <p className="text-sm text-gray-500 mt-1">Lihat daftar staff dan brand yang mereka kelola</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Manajemen Hak Akses</p>
          <p className="text-xs text-blue-600 mt-1">
            Assign staff ke brand melalui halaman <strong>Brand</strong>. Setiap staff hanya bisa melihat dan mengelola produk dari brand yang ditugaskan kepada mereka.
          </p>
        </div>
      </div>

      {/* Managers */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          Manager ({managerUsers.length})
        </h2>
        <div className="space-y-2">
          {managerUsers.map(user => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500">Manager • Akses penuh ke semua brand</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Manager</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-green-500" />
          Staff Gudang ({staffUsers.length})
        </h2>
        <div className="space-y-2">
          {staffUsers.map(user => {
            const assignedBrands = brands.filter(b => b.assignedStaff.includes(user.id) && b.status === 'active');
            return (
              <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">Staff Gudang</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Staff</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Brand yang dikelola:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedBrands.length > 0 ? (
                      assignedBrands.map(brand => (
                        <span key={brand.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" /> {brand.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">Belum ada brand yang ditugaskan</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          Ringkasan Akses (Tabel)
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Brand yang Dikelola</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Jumlah Brand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => {
                const userBrands = user.role === 'manager' ? brands.filter(b => b.status === 'active') : brands.filter(b => b.assignedStaff.includes(user.id) && b.status === 'active');
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'manager' ? 'bg-purple-100' : 'bg-green-100'
                        }`}>
                          {user.role === 'manager' ? <Shield className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-green-600" />}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        user.role === 'manager' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'manager' ? 'Manager' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {userBrands.slice(0, 3).map(b => (
                          <span key={b.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{b.name}</span>
                        ))}
                        {userBrands.length > 3 && <span className="text-xs text-gray-400">+{userBrands.length - 3} lainnya</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-gray-900">{userBrands.length}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
