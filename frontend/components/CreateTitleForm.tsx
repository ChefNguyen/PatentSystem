import { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Check, Search, ArrowLeft, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ColorSelect, getColorHex } from './ColorSelect';
import { titleAPI } from '../services/api';

interface CreateTitleFormProps {
  onBack?: () => void;
  onSave?: (titleData: any) => void;
}

export function CreateTitleForm({ onBack, onSave }: CreateTitleFormProps) {
  const [permission, setPermission] = useState('');
  const [titleName, setTitleName] = useState('');
  const [dataType, setDataType] = useState(''); // 特許, 論文, etc.
  const [markType, setMarkType] = useState('マークなし');
  const [parentTitle, setParentTitle] = useState('');
  const [saveDate, setSaveDate] = useState('2025/11');
  const [disallowEvaluation, setDisallowEvaluation] = useState(false);
  const [allowEvaluation, setAllowEvaluation] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const [showUserSearchDialog, setShowUserSearchDialog] = useState(false);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [permissionWarningMessage, setPermissionWarningMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdTitleInfo, setCreatedTitleInfo] = useState<any>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Fetch all users and departments from API
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [parentTitles, setParentTitles] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching users, departments, and parent titles...');
        const token = localStorage.getItem('authToken');
        const currentUsername = localStorage.getItem('username');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch users
        const usersRes = await fetch('http://localhost:4001/api/users', { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          console.log('📦 Raw users API response:', usersData);

          if (usersData.data && usersData.data.users) {
            console.log('👤 First user sample:', usersData.data.users[0]);

            // Map users with department name
            // Backend already flattens department to string, so use it directly
            const mappedUsers = usersData.data.users.map((u: any) => {
              // Backend returns department as string already
              const deptName = typeof u.department === 'string' ? u.department : (u.department?.name || u.departmentName || '');
              console.log(`Mapping user ${u.userId}: dept = "${deptName}"`, u);
              return {
                ...u,
                dept: deptName
              };
            });

            console.log('✅ Mapped users:', mappedUsers);
            setAllUsers(mappedUsers);

            // Find current logged-in user and set as default first row
            const currentUser = mappedUsers.find((u: any) => u.userId === currentUsername);
            if (currentUser) {
              setSelectedUsers([{
                id: Date.now(),
                userId: currentUser.userId,
                name: currentUser.name,
                dept: currentUser.dept,
                section: currentUser.section || '',
                permission: currentUser.role || currentUser.permission || '管理者',
                isMain: true, // Default to main responsible
                displayOrder: 0,
                userDisplayOrder: 0,
                evalEmail: false,
                confirmEmail: false,
                isEmpty: false
              }]);
              console.log('✅ Set current user as default:', currentUser);
            }
          }
        }

        // Fetch departments
        const deptsRes = await fetch('http://localhost:4001/api/users/departments', { headers });
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          if (deptsData.data && deptsData.data.departments) {
            setDepartments(deptsData.data.departments);
          }
        } else {
          console.error('❌ Failed to fetch departments:', deptsRes.status, deptsRes.statusText);
        }

        // Fetch parent titles
        try {
          const titlesResult = await titleAPI.getAll();
          console.log('📦 titleAPI.getAll() result:', titlesResult);

          let titles: any[] = [];

          // Handle nested response: { data: { data: { titles: [...] } } }
          if (titlesResult.data?.data?.titles) {
            titles = titlesResult.data.data.titles;
          }
          // Handle direct response: { data: { titles: [...] } }
          else if (titlesResult.data?.titles) {
            titles = titlesResult.data.titles;
          }
          // Handle array response: { data: [...] }
          else if (Array.isArray(titlesResult.data)) {
            titles = titlesResult.data;
          }
          // Handle error case
          else if (titlesResult.error) {
            console.error('❌ API Error fetching titles:', titlesResult.error);
            titles = [];
          }

          // Filter out current title being created (if any) and ensure we have valid titles
          const validTitles = titles.filter(t => t && (t.id || t.no) && (t.titleName || t.title || t.name));

          setParentTitles(validTitles);
          console.log('✅ Loaded parent titles:', validTitles.length, validTitles);
        } catch (err) {
          console.error('❌ Error fetching parent titles:', err);
          setParentTitles([]);
        }

        console.log('✅ Loaded users and departments');
      } catch (err) {
        console.error('❌ Error fetching data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);



  const handleDepartmentSelect = (deptId: number, checked: boolean) => {
    if (checked) {
      setSelectedDepartments([...selectedDepartments, deptId]);
    } else {
      setSelectedDepartments(selectedDepartments.filter(id => id !== deptId));
    }
  };

  const handleExecuteSettings = async () => {
    // Collect all users from selected departments
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const collectedUsers: any[] = [];

      for (const deptId of selectedDepartments) {
        try {
          const res = await fetch(`http://localhost:4001/api/departments/${deptId}/users`, { headers });
          if (res.ok) {
            const data = await res.json();
            const deptUsers = data.data?.users || [];
            // Normalize and map permission from API response
            const normalized = deptUsers.map((u: any) => {
              // Map permission from user object (can be 'permission' or derived from bit flags)
              let permission = '一般'; // default
              if (u.permission) {
                permission = u.permission;
              } else if (u.isAdmin) {
                permission = '管理者';
              } else if (u.isViewer) {
                permission = '閲覧';
              } else if (u.isGeneral) {
                permission = '一般';
              }

              return {
                ...u,
                permission, // Ensure permission is set
                // some endpoints return `department` object, others return `dept` string
                dept: u.dept || (u.department && (u.department.name || u.department.title || u.department.no)) || u.departmentName || '',
                isMain: u.isMainResponsible || false, // Map isMainResponsible to isMain for UI
              };
            });
            collectedUsers.push(...normalized);
            console.log('✅ Normalized users from department:', normalized);
          }
        } catch (err) {
          console.error(`Error fetching users for department ${deptId}:`, err);
        }
      }

      // Update the main user list with selected department users
      setSelectedUsers(collectedUsers);
      console.log('✅ Added users from selected departments:', collectedUsers.length, collectedUsers);
    } catch (err) {
      console.error('❌ Error executing department settings:', err);
    }

    // Close the dialog
    setShowDepartmentDialog(false);

    // Reset selections
    setSelectedDepartments([]);
  };

  const resolvePermission = (u: any) => {
    if (!u) return '一般';
    if (u.permission) return u.permission;
    if (u.permission_flag) return u.permission_flag;
    if (u.isAdmin) return '管理者';
    if (u.isViewer) return '閲覧';
    if (u.isGeneral) return '一般';
    // try lookup from allUsers by userId
    const found = allUsers.find((au: any) => au.userId === u.userId || au.id === u.id);
    if (found && (found.permission || found.permission_flag)) return found.permission || found.permission_flag;
    return '一般';
  };

  const handleToggleMain = (userId: number) => {
    const user = selectedUsers.find(u => u.id === userId);
    const resolvedPerm = resolvePermission(user);

    // Validate: only 管理者 can be main responsible
    if (user && !user.isMain && resolvedPerm !== '管理者') {
      setPermissionWarningMessage(`${user.name || 'このユーザー'}は権限が「${resolvedPerm}」のため、主担当に設定できません。\n主担当は「管理者」権限のみ設定可能です。`);
      setShowPermissionWarning(true);
      return;
    }

    setSelectedUsers(selectedUsers.map(u =>
      u.id === userId ? { ...u, isMain: !u.isMain } : u
    ));
  };

  const handlePermissionChange = (userId: number, newPermission: string) => {
    setSelectedUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        const updatedUser = { ...user, permission: newPermission };

        // If user is currently main but permission downgraded, remove main role
        if (updatedUser.isMain && newPermission !== '管理者') {
          setPermissionWarningMessage(`${updatedUser.name || 'このユーザー'}の権限を「${newPermission}」に変更したため、主担当設定を解除しました。\\n主担当は「管理者」権限のみ設定可能です。`);
          setShowPermissionWarning(true);
          updatedUser.isMain = false;
        }

        return updatedUser;
      })
    );
  };

  const handleAddEmptyRow = () => {
    const newUser = {
      id: Date.now(),
      userId: '',
      name: '',
      dept: '',
      section: '',
      permission: '一般',
      isMain: false,
      displayOrder: 0,
      userDisplayOrder: 0,
      evalEmail: false,
      confirmEmail: false,
      isEmpty: true
    };
    setSelectedUsers([...selectedUsers, newUser]);
  };

  const handleDeleteUser = (userId: number) => {
    const user = selectedUsers.find(u => u.id === userId);
    const userName = user?.name || user?.userId || 'このユーザー';

    if (confirm(`${userName}を削除してもよろしいですか？`)) {
      setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
      console.log(`✅ Deleted user: ${userName}`);
    }
  };

  const handleOpenUserSearch = (userId: number) => {
    setEditingUserId(userId);
    setShowUserSearchDialog(true);
  };

  const handleSelectUserFromDialog = (selectedUser: any) => {
    if (editingUserId) {
      // Update the row with selected user info
      setSelectedUsers(selectedUsers.map(user =>
        user.id === editingUserId ? {
          ...user,
          userId: selectedUser.userId,
          name: selectedUser.name,
          dept: selectedUser.dept,
          permission: selectedUser.permission,
          isEmpty: false
        } : user
      ));

      // Close dialog and reset
      setShowUserSearchDialog(false);
      setEditingUserId(null);
    }
  };

  const handleSubmit = async () => {
    if (!titleName) {
      setShowWarning(true);
      return;
    }

    try {
      // Prepare title data for API
      // Filter out users without userId
      const validUsers = selectedUsers.filter(u => u.userId && u.userId.trim() !== '');

      const titleData = {
        titleName,
        dataType: dataType || '特許',
        markColor: markType !== 'マークなし' ? getColorHex(markType) : undefined,
        parentTitleId: parentTitle && parentTitle !== '__none__' ? parentTitle : undefined, // Send parent title ID
        saveDate,
        disallowEvaluation,
        allowEvaluation,
        viewPermission: 'all',
        editPermission: 'creator',
        mainEvaluation: true,
        singlePatentMultipleEvaluations: false,
        users: validUsers.map(u => ({
          userId: u.userId,
          isMainResponsible: u.isMain || false,
          permission: resolvePermission(u),
          evalEmail: u.evalEmail || false,
          confirmEmail: u.confirmEmail || false,
          displayOrder: u.displayOrder || 0
        }))
      };

      console.log('📤 Submitting title data:', titleData);
      console.log('📤 Valid users count:', validUsers.length);

      const result = await titleAPI.create(titleData);

      console.log('📦 API Result:', result);

      if (result.error) {
        console.error('❌ Failed to create title:', result.error);
        setPermissionWarningMessage(`タイトル作成に失敗しました\n\n${result.error}`);
        setShowPermissionWarning(true);
        return;
      }

      console.log('✅ Title created successfully:', result.data);

      // Extract title info from response
      // Backend may return: { data: { id, titleNo, message } } or { id, titleNo, message }
      const titleInfo = result.data?.data || result.data;
      console.log('📋 Title info:', titleInfo);

      // Show success dialog
      setCreatedTitleInfo({
        titleName,
        titleNo: titleInfo?.titleNo || titleInfo?.id || 'N/A',
        dataType
      });
      setShowSuccessDialog(true);
      console.log('✅ Success dialog should be visible now');

      // Don't call onSave here - it will close the form immediately
      // Instead, call it when user clicks "一覧に戻る" button
    } catch (error) {
      console.error('❌ Error creating title:', error);
      setPermissionWarningMessage(`タイトル作成中にエラーが発生しました\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowPermissionWarning(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="flex items-center gap-4 mb-4">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="border-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Button>
        )}
        <h2 className="text-2xl bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
          新規タイトル作成
        </h2>
      </div>

      {/* Warning message */}
      {showWarning && (
        <Alert className="bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-300">
            タイトルの基本情報を設定します。
          </AlertDescription>
        </Alert>
      )}

      {/* Header with buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <span className="text-lg dark:text-slate-200">タイトルの基本情報を設定します。</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            保存
          </Button>
        </div>
      </div>

      {/* Section 1: Title Name (Required) */}
      <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">必須</span>
            <span className="dark:text-slate-200">1.保存データタイトル名</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Row 1: Data Type and Mark Type */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="dataType" className="dark:text-slate-200">データ種別</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger id="dataType" className="border-2 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                    <SelectValue placeholder="一選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="特許">特許</SelectItem>
                    <SelectItem value="論文">論文</SelectItem>
                    <SelectItem value="意匠">意匠</SelectItem>
                    <SelectItem value="商標">商標</SelectItem>
                    <SelectItem value="フリー">フリー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="markType" className="dark:text-slate-200">マーク</Label>
                <ColorSelect
                  id="markType"
                  value={markType}
                  onValueChange={setMarkType}
                  className="border-2"
                />
              </div>
            </div>

            {/* Row 2: Title Name and Parent Title */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="titleName" className="dark:text-slate-200">タイトル名</Label>
                <Input
                  id="titleName"
                  value={titleName}
                  onChange={(e) => setTitleName(e.target.value)}
                  placeholder="タイトル名を入力してください"
                  className="border-2 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="parentTitle" className="dark:text-slate-200">上位階層タイトル</Label>
                <div className="flex gap-2">
                  <Select value={parentTitle} onValueChange={setParentTitle}>
                    <SelectTrigger id="parentTitle" className="border-2 flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">なし</SelectItem>
                      {parentTitles && parentTitles.length > 0 ? (
                        parentTitles.map((title: any) => (
                          <SelectItem key={title.id || title.no} value={title.id || title.no}>
                            {title.no}：{title.titleName || title.title || title.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          タイトルがありません
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Row 3: Save Date */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="saveDate" className="dark:text-slate-200">保存年月</Label>
                <Input
                  id="saveDate"
                  value={saveDate}
                  onChange={(e) => setSaveDate(e.target.value)}
                  placeholder="（入力形式：YYYY/MM）"
                  className="border-2 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                />
              </div>
              <div className="flex-1">
                {/* Empty space for alignment */}
              </div>
            </div>

            {/* Evaluation display permission */}
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-slate-700">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="disallow-eval"
                    checked={disallowEvaluation}
                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                      setDisallowEvaluation(typeof checked === 'boolean' ? checked : false);
                      if (checked) setAllowEvaluation(false);
                    }}
                  />
                  <Label htmlFor="disallow-eval" className="cursor-pointer dark:text-slate-200">
                    他タイトルからの評価の表示を許可しない
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allow-eval"
                    checked={allowEvaluation}
                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                      setAllowEvaluation(typeof checked === 'boolean' ? checked : false);
                      if (checked) setDisallowEvaluation(false);
                    }}
                  />
                  <Label htmlFor="allow-eval" className="cursor-pointer dark:text-slate-200">
                    許可する
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: User Management Settings */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="pb-4">
          <CardTitle className="font-bold dark:text-slate-200">2.利用者管理設定</CardTitle>
          <p className="text-sm text-gray-600 mt-2 dark:text-slate-400">
            このタイトルで評価を行える人を設定できます。管理者のユーザーは必須対象です。<br />
            管理者のみ登録できる設定となります。評価済みになった人は削除されても保存されます。<br />
            削除者検定はシステムの中の削除評価・公開評価の登録は削除しません。
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-center text-gray-500 border-2 border-gray-200 rounded p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
            書籍が指定されていません
          </div>

          {/* Department Settings Button */}
          <div className="mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDepartmentDialog(true)}
              className="border-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              部署で設定
            </Button>
          </div>

          <div className="border-2 border-gray-200 rounded-lg overflow-hidden dark:border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-slate-800 dark:to-slate-800">
                  <TableHead className="dark:text-slate-300">新規</TableHead>
                  <TableHead className="dark:text-slate-300">氏名</TableHead>
                  <TableHead className="dark:text-slate-300">ユーザID</TableHead>
                  <TableHead className="dark:text-slate-300">権限</TableHead>
                  <TableHead className="dark:text-slate-300">部署名</TableHead>
                  <TableHead className="dark:text-slate-300">主担当</TableHead>
                  <TableHead className="text-center dark:text-slate-300">削除</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedUsers.map((user) => (
                  <TableRow key={user.id} className="dark:hover:bg-slate-800">
                    <TableCell>
                      <Button size="sm" variant="outline" className="h-8 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                        新規
                      </Button>
                    </TableCell>
                    <TableCell className="dark:text-slate-200">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 dark:text-slate-200">
                        <span>{user.userId}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 dark:hover:bg-slate-700"
                          onClick={() => handleOpenUserSearch(user.id)}
                        >
                          <Search className="w-3 h-3 dark:text-slate-300" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={resolvePermission(user)}
                        onValueChange={(value: string) => handlePermissionChange(user.id, value)}
                      >
                        <SelectTrigger className="h-8 border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="管理者">管理者</SelectItem>
                          <SelectItem value="一般">一般</SelectItem>
                          <SelectItem value="閲覧">閲覧</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="dark:text-slate-200">{user.dept}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleMain(user.id)}
                          className="focus:outline-none"
                        >
                          <div className={`w-4 h-4 rounded-full border-2 ${user.isMain ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-slate-500'} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}>
                            {user.isMain && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-slate-700"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button size="sm" variant="outline" className="mt-4 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700" onClick={handleAddEmptyRow}>
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </CardContent>
      </Card>

      {/* Department Dialog */}
      <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
        <DialogContent className="max-w-4xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-100 to-yellow-100 px-3 py-1 rounded dark:from-slate-800 dark:to-slate-800">
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">特許ナビ</span>
              </div>
              <span className="text-gray-400">|</span>
              <DialogTitle className="text-base dark:text-slate-200">部署で設定</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              部署を選択してユーザーを設定します
            </DialogDescription>
            <Button
              variant="link"
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setShowDepartmentDialog(false)}
            >
              閉じる
            </Button>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <Button
                size="sm"
                variant="outline"
                className="border-2 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={handleExecuteSettings}
              >
                設定を実行する
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span className="mr-2">🔄</span>
                最新に更新
              </Button>
            </div>

            <div className="border-2 border-gray-200 rounded-lg overflow-hidden dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-slate-800">
                    <TableHead className="w-20 dark:text-slate-300">表示順</TableHead>
                    <TableHead className="w-32 dark:text-slate-300">No.</TableHead>
                    <TableHead className="dark:text-slate-300">部署名</TableHead>
                    <TableHead className="dark:text-slate-300">部署略称</TableHead>
                    <TableHead className="text-right dark:text-slate-300">ユーザー数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <TableRow key={dept.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedDepartments.includes(dept.id)}
                            onCheckedChange={(checked: boolean | 'indeterminate') => handleDepartmentSelect(dept.id, typeof checked === 'boolean' ? checked : false)}
                          />
                        </TableCell>
                        <TableCell className="dark:text-slate-200">{dept.no}</TableCell>
                        <TableCell className="dark:text-slate-200">{dept.name}</TableCell>
                        <TableCell className="text-gray-400 dark:text-slate-400">{dept.abbr}</TableCell>
                        <TableCell className="text-right dark:text-slate-200">{dept.userCount}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        要望が設定されていません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Search Dialog */}
      <Dialog open={showUserSearchDialog} onOpenChange={setShowUserSearchDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 shrink-0 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-100 to-yellow-100 px-3 py-1 rounded dark:from-slate-800 dark:to-slate-800">
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">特許ナビ</span>
              </div>
              <span className="text-gray-400">|</span>
              <DialogTitle className="text-base dark:text-slate-200">ユーザ指定補助</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              ユーザーを検索して追加します
            </DialogDescription>
            <Button
              variant="link"
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setShowUserSearchDialog(false)}
            >
              閉じる
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden dark:bg-slate-900 dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-slate-800">
                    <TableHead className="w-40 dark:text-slate-300">ユーザID</TableHead>
                    <TableHead className="dark:text-slate-300">氏名</TableHead>
                    <TableHead className="w-48 dark:text-slate-300">部署</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 cursor-pointer dark:hover:bg-slate-800"
                      onClick={() => handleSelectUserFromDialog(user)}
                    >
                      <TableCell className="dark:text-slate-200">{user.userId}</TableCell>
                      <TableCell className="text-blue-600 dark:text-blue-400">{user.name}</TableCell>
                      <TableCell className="dark:text-slate-200">{user.dept}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Warning Dialog */}
      <Dialog open={showPermissionWarning} onOpenChange={setShowPermissionWarning}>
        <DialogContent className="max-w-lg border-2 border-orange-200 shadow-2xl dark:bg-slate-900 dark:border-orange-900">
          <DialogHeader className="border-b pb-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center dark:from-orange-900/30 dark:to-yellow-900/30">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-slate-200">
                  権限エラー
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">
                  操作を完了できません
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg dark:bg-orange-900/20 dark:border-orange-600">
              <div className="space-y-2">
                {permissionWarningMessage.split('\n').map((line, index) => (
                  <p key={index} className="text-gray-800 leading-relaxed dark:text-slate-200">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
            <Button
              onClick={() => setShowPermissionWarning(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 shadow-md hover:shadow-lg transition-all dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md border-2 border-orange-200 dark:bg-slate-900 dark:border-orange-900">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center dark:from-orange-900/30 dark:to-yellow-900/30">
                <Check className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <DialogTitle className="text-base dark:text-slate-200">タイトルを作成しました</DialogTitle>
                <p className="text-xs text-gray-500 dark:text-slate-400">正常に保存されました</p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {createdTitleInfo && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg p-4 dark:from-slate-800 dark:to-slate-800 dark:border-orange-800">
                <div className="flex items-start gap-3">
                  <Save className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5 dark:text-orange-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1 dark:text-slate-200">
                      {createdTitleInfo.titleName}
                    </p>
                    <div className="flex gap-2 text-xs text-gray-600 dark:text-slate-400">
                      {createdTitleInfo.titleNo && (
                        <span>No: {createdTitleInfo.titleNo}</span>
                      )}
                      {createdTitleInfo.dataType && (
                        <Badge variant="outline" className="text-xs">
                          {createdTitleInfo.dataType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                setCreatedTitleInfo(null);

                // Call onSave to trigger refresh in parent
                if (onSave) {
                  console.log('📞 Calling onSave callback from dialog button');
                  onSave({ success: true });
                }

                // Then go back to list
                if (onBack) {
                  onBack();
                }
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              一覧に戻る
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}