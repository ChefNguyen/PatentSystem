import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { userAPI, titleAPI, patentAPI } from '../services/api';
import { notifySuccess, notifyError, notifyWarning } from '../utils/notifications';

interface User {
  id: string;
  userId: string;
  name: string;
  assignedCount: number;
  isChecked: boolean;
}

interface Patent {
  id: string;
  documentNum?: string;
}

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  titleNo?: string;
  titleName?: string;
  titleId?: string;
  patents?: Patent[];
  onAssignmentComplete?: () => void;
  responsible?: string;
  responsibleId?: string;
  hideRangeSelector?: boolean;
  hideAddMode?: boolean;
}

export function AssignmentDialog({
  isOpen,
  onClose,
  titleNo,
  titleName,
  titleId,
  patents = [],
  onAssignmentComplete,
  responsible,
  responsibleId,
  hideRangeSelector = false,
  hideAddMode = false
}: AssignmentDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allChecked, setAllChecked] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState(hideAddMode ? 'replace' : 'add');
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const totalCount = patents.length;
  const maxNo = totalCount;

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setRangeTo(String(totalCount || 1));
    }
  }, [isOpen, totalCount, titleId]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let mappedUsers: any[] = [];

      if (titleId) {
        console.log('🔄 Fetching users for titleId:', titleId);
        const res = await titleAPI.getById(titleId);
        console.log('📦 AssignmentDialog - titleAPI.getById response:', res);

        // Backend controller returns { data: title } or { data: { data: title } } depending on implementation
        const titleData = res.data?.data || res.data;
        console.log('📦 AssignmentDialog - titleData:', titleData);

        // Handle both 'users' (if transformed) and 'titleUsers' (raw Prisma response)
        const usersList = titleData?.users || titleData?.titleUsers || [];
        console.log('📦 AssignmentDialog - usersList:', usersList);

        if (usersList && Array.isArray(usersList)) {
          mappedUsers = usersList.map((u: any) => {
            // Handle nested user object (from titleUsers relation) or flat user object
            const userInfo = u.user || u;
            return {
              id: userInfo.id,
              userId: userInfo.userId,
              name: userInfo.name || userInfo.userId,
              assignedCount: u.assignedCount || 0, // This might need to be calculated separately if not in response
              isChecked: false
            };
          });
        }
      } else {
        const result = await userAPI.getAll();
        console.log('API Response:', result);

        // Handle nested response structure: result.data.data.users
        const userData = result.data?.data?.users || result.data?.users || result.users || [];

        mappedUsers = userData.map((u: any) => ({
          id: u.id,
          userId: u.userId,
          name: u.name,
          assignedCount: u.assignedCount || 0,
          isChecked: false
        }));
      }

      console.log('FetchUsers - responsibleId:', responsibleId);
      console.log('FetchUsers - responsible:', responsible);
      console.log('FetchUsers - Total users fetched:', mappedUsers.length);

      // Filter by responsibleId if provided (and not already filtered by titleId logic, though we might still want to select it)
      // If titleId is provided, we trust the list from titleAPI. 
      // But we might still want to highlight/select the responsible person if they are in the list.

      // If NO titleId was provided, we might filter by responsibleId as before? 
      // The original logic was: fetch ALL users, then filter to ONLY responsibleId if provided.
      // But now we want to show ALL users assigned to the title.

      // If responsibleId is provided, we should probably check that user by default?
      // Or if the requirement "only display users configured in Part 2" overrides the "filter by responsibleId" logic?
      // The previous logic filtered the LIST to only the responsible person.
      // The new requirement is "only display users configured in Part 2".
      // So we should display ALL users from Part 2.

      // If responsibleId is provided, maybe we should check them?
      // But the previous logic was "Filter by responsibleId if provided".
      // If I change it to "Show all users from Title", I should probably remove the filtering by responsibleId
      // unless responsibleId is used to pre-select.

      // Let's assume we show all users from Title (if titleId present), 
      // OR show all users (if no titleId), 
      // AND then if responsibleId is present, maybe we filter? 
      // Wait, the previous logic was: if responsibleId is present, ONLY show that user.
      // That seems contradictory to "Show users from Part 2".
      // "Part 2" usually contains multiple users.
      // If I filter by responsibleId, I only show 1 user.
      // The user request says "button này chỉ hiển thị những user mà được 設定 ở phần 2.利用者管理設定 thôi"
      // This implies showing the list from Part 2.

      // So I should SKIP the responsibleId filtering if titleId is present.

      if (!titleId && responsibleId) {
        console.log('Filtering users by responsibleId:', responsibleId);
        const filteredById = mappedUsers.filter((u: any) => u.id === responsibleId);
        if (filteredById.length > 0) {
          mappedUsers = filteredById;
        } else {
          // ... fallback ...
          if (responsible) {
            mappedUsers = mappedUsers.filter((u: any) => u.name === responsible);
          } else {
            mappedUsers = [];
          }
        }
      } else if (!titleId && responsible) {
        mappedUsers = mappedUsers.filter((u: any) => u.name === responsible);
      }

      console.log('Filtered users count:', mappedUsers.length);

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAll = (checked: boolean) => {
    setAllChecked(checked);
    setUsers(users.map(u => ({ ...u, isChecked: checked })));
  };

  const handleUserToggle = (userId: string) => {
    const newUsers = users.map(u =>
      u.id === userId ? { ...u, isChecked: !u.isChecked } : u
    );
    setUsers(newUsers);
    setAllChecked(newUsers.every(u => u.isChecked));
  };

  const handleAssignment = async () => {
    const selectedUsers = users.filter(u => u.isChecked);
    const from = parseInt(rangeFrom) || 1;
    const to = parseInt(rangeTo) || totalCount;

    // Validate
    if (assignmentMode !== 'remove' && selectedUsers.length === 0) {
      notifyWarning('ユーザを選択してください');
      return;
    }

    // Get patents in range (1-indexed)
    let patentsInRange = patents;
    if (!hideRangeSelector) {
      if (from > to || from < 1 || to > totalCount) {
        notifyWarning('有効な範囲を指定してください');
        return;
      }
      patentsInRange = patents.slice(from - 1, to);
    }

    if (patentsInRange.length === 0) {
      notifyWarning('対象の案件がありません');
      return;
    }

    setIsExecuting(true);
    try {
      // Call API to assign/replace/remove
      const result = await patentAPI.assign(
        assignmentMode as 'add' | 'replace' | 'remove',
        patentsInRange.map(p => p.id),
        selectedUsers.map(u => u.id)
      );

      if (result.error) {
        notifyError('エラー', result.error);
      } else {
        const modeText = assignmentMode === 'add' ? '追加' :
          assignmentMode === 'replace' ? '置き換え' : '削除';
        notifySuccess(`担当者の${modeText}が完了しました`, `${patentsInRange.length}件`);

        // Refresh user list to update counts
        await fetchUsers();

        onAssignmentComplete?.();
        // Do not close dialog immediately to let user see updated counts?
        // Or maybe close it as requested? Usually "Batch execution" implies closing or staying.
        // If we want to see updated counts, we should probably stay open or re-open.
        // But the user flow usually is: Open -> Select -> Execute -> Done.
        // If the user wants to see the result, they might open it again.
        // However, the request says "分担件数 cũng sẽ được cập nhật trên UI".
        // This implies that IF the dialog stays open (or if we are talking about the list), it should update.
        // But the dialog usually closes after execution in my previous code: onClose().
        // If I remove onClose(), the user can see the updated counts.
        // Let's keep onClose() for now but ensure data is refreshed if they re-open.
        // Wait, if I close it, they won't see the UI update unless they re-open.
        // Maybe the user implies the UI *behind* the dialog? Or the dialog itself?
        // "sau khi 一括分担実行 thì 分担件数 cũng sẽ được cập nhật trên UI chứ"
        // "分担件数" is a column in the dialog's table.
        // So likely they want to see it updated IN THE DIALOG.
        // So I should NOT close the dialog automatically, or I should refresh it before closing?
        // If I close it, they can't see it.
        // Let's remove onClose() so they can see the result, or ask?
        // Usually batch operations might keep the dialog open for further actions.
        // Let's comment out onClose() and see, or better, just refresh.
        // Actually, if I close it, the "UI" could mean the main page too?
        // But "分担件数" (Assigned Count) is specifically in this dialog.
        // So I should probably keep the dialog open.

        // Let's remove onClose() to allow user to see the updated counts.
        // onClose(); 

      }
    } catch (err) {
      console.error('Assignment failed:', err);
      notifyError('処理中にエラーが発生しました');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader className="border-b pb-3 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent">
                特許ナビ
              </span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-gray-700 dark:text-slate-200">担当者設定</span>
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            担当者を設定・管理するためのダイアログです。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* User Table */}
          <div className="border-2 border-orange-300 rounded-lg overflow-hidden bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <div className="bg-gradient-to-r from-orange-100 to-yellow-100 px-4 py-2 flex items-center justify-between border-b-2 border-orange-300 dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-sm dark:text-slate-200">CK</span>
                <span className="text-sm dark:text-slate-200">全</span>
                <button
                  onClick={() => handleToggleAll(true)}
                  className={`text-sm px-2 py-0.5 rounded transition-colors ${allChecked
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                  ON
                </button>
                <span className="text-sm text-gray-400">/</span>
                <button
                  onClick={() => handleToggleAll(false)}
                  className={`text-sm px-2 py-0.5 rounded transition-colors ${!allChecked
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                    }`}
                >
                  OFF
                </button>
              </div>
              <div className="text-sm text-gray-700 dark:text-slate-300">
                全件数 <span className="text-blue-600 font-medium dark:text-blue-400">{totalCount}</span> 件
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full bg-white dark:bg-slate-900">
                <thead className="bg-orange-50 border-b border-orange-200 sticky top-0 dark:bg-slate-800 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm w-16 dark:text-slate-200">CK</th>
                    <th className="px-4 py-2 text-left text-sm dark:text-slate-200">ユーザID</th>
                    <th className="px-4 py-2 text-left text-sm dark:text-slate-200">ユーザ名</th>
                    <th className="px-4 py-2 text-left text-sm w-24 dark:text-slate-200">分担件数</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                        読み込み中...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                        ユーザがいません
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr
                        key={user.id}
                        className={`border-b border-orange-100 cursor-pointer transition-colors dark:border-slate-800 ${user.isChecked ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-orange-50/50 dark:hover:bg-slate-800'
                          }`}
                        onClick={() => handleUserToggle(user.id)}
                      >
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={user.isChecked}
                            onCheckedChange={() => handleUserToggle(user.id)}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm dark:text-slate-200">{user.userId}</td>
                        <td className="px-4 py-2 text-sm dark:text-slate-200">{user.name}</td>
                        <td className="px-4 py-2 text-sm text-center dark:text-slate-200">{user.assignedCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assignment Options */}
          <div className="border-2 border-orange-300 rounded-lg p-4 space-y-3 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <RadioGroup value={assignmentMode} onValueChange={setAssignmentMode}>
              {!hideAddMode && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="add" className="dark:border-slate-400 dark:text-slate-200" />
                  <Label htmlFor="add" className="text-sm cursor-pointer dark:text-slate-200">
                    指定したユーザを担当者として追加する
                  </Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" className="dark:border-slate-400 dark:text-slate-200" />
                <Label htmlFor="replace" className="text-sm cursor-pointer dark:text-slate-200">
                  担当者を指定したユーザに置き換える
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" className="dark:border-slate-400 dark:text-slate-200" />
                <Label htmlFor="remove" className="text-sm cursor-pointer dark:text-slate-200">
                  全担当者を外す
                </Label>
              </div>
            </RadioGroup>

            {!hideRangeSelector && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm dark:text-slate-200">No</span>
                <Input
                  type="text"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="w-24 h-8 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                  placeholder=""
                />
                <span className="text-sm dark:text-slate-200">〜</span>
                <Input
                  type="text"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="w-24 h-8 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                  placeholder=""
                />
                <span className="text-sm dark:text-slate-200">まで</span>
                <span className="text-sm text-gray-500 ml-4 dark:text-slate-400">最終No:{maxNo}</span>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleAssignment}
                disabled={isExecuting}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                {isExecuting ? '処理中...' : '一括分担実行'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}