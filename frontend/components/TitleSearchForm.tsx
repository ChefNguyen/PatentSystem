import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { titleAPI, patentAPI, importExportAPI } from '../services/api';
import { notifySuccess, notifyError, notifyWarning, notifyInfo } from '../utils/notifications';

interface TitleSearchFormProps {
  onBack?: () => void;
}

interface SearchResult {
  id: string;
  no: string;
  title: string;
  dataCount: number;
  department: string;
  responsible: string;
}

interface PatentListItem {
  documentNo: string;
  applicationNo: string;
  applicationDate: string;
  publicationDate: string;
  inventionName: string;
  applicant: string;
  publicationNo: string;
  announcementNo: string;
  registrationNo: string;
  trialNo: string;
  other: string;
  stage: string;
  event: string;
  documentUrl: string;
}

interface HistoryItem {
  id: string;
  name: string;
  value: string;
  field: string;
}

interface PatentDetail {
  titleCode: string;
  titleName: string;
  publicationNo: string;
  registrationNo: string;
  applicant: string;
  inventionName: string;
  abstract: string;
  claims: string;
  inventor: string;
  ipc: string;
  applicationNo: string;
  applicationDate: string;
  publicationDate: string;
  registrationDate: string;
  fi: string;
  fTerm: string;
  publicationType: string;
}

export function TitleSearchForm({ onBack }: TitleSearchFormProps) {
  const [searchMethod, setSearchMethod] = useState<'number' | 'condition'>('number');
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [totalSelectedCount, setTotalSelectedCount] = useState(0);
  const [searchOption, setSearchOption] = useState<'exact' | 'partial'>('exact');
  const [patentCount, setPatentCount] = useState(0);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [searchExpression, setSearchExpression] = useState('S2×S1');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [patentListData, setPatentListData] = useState<PatentListItem[]>([]);
  const [rawPatents, setRawPatents] = useState<any[]>([]);
  const [isLoadingTitles, setIsLoadingTitles] = useState(true);
  const [isLoadingPatents, setIsLoadingPatents] = useState(false);
  const [patentDetail, setPatentDetail] = useState<PatentDetail>({
    titleCode: '',
    titleName: '',
    publicationNo: '',
    registrationNo: '',
    applicant: '',
    inventionName: '',
    abstract: '',
    claims: '',
    inventor: '',
    ipc: '',
    applicationNo: '',
    applicationDate: '',
    publicationDate: '',
    registrationDate: '',
    fi: '',
    fTerm: '',
    publicationType: ''
  });
  const [numberInput, setNumberInput] = useState('');
  const [numberType, setNumberType] = useState('publication');
  const [searchNameField, setSearchNameField] = useState('applicant');
  const [searchNameValue, setSearchNameValue] = useState('');

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [nextHistoryId, setNextHistoryId] = useState(1);
  const [currentDetailIndex, setCurrentDetailIndex] = useState(0);

  const updateDetailView = (raw: any, index: number) => {
    if (!raw) return;
    setPatentDetail({
      titleCode: raw.title?.titleNo || '',
      titleName: raw.title?.titleName || '',
      publicationNo: raw.publicationNum || '',
      registrationNo: raw.registrationNum || '',
      applicant: raw.applicantName || '',
      inventionName: raw.inventionTitle || '',
      abstract: raw.abstract || '',
      claims: raw.claims || '',
      inventor: raw.inventor || '',
      ipc: raw.fiClassification || '',
      applicationNo: raw.applicationNum || '',
      applicationDate: raw.applicationDate ? new Date(raw.applicationDate).toLocaleDateString() : '',
      publicationDate: raw.publicationDate ? new Date(raw.publicationDate).toLocaleDateString() : '',
      registrationDate: raw.registrationDate ? new Date(raw.registrationDate).toLocaleDateString() : '',
      fi: raw.fiClassification || '',
      fTerm: '',
      publicationType: ''
    });
    setCurrentDetailIndex(index);
  };

  const handlePrevPatent = () => {
    if (currentDetailIndex > 0) {
      const newIndex = currentDetailIndex - 1;
      updateDetailView(rawPatents[newIndex], newIndex);
    }
  };

  const handleNextPatent = () => {
    if (currentDetailIndex < rawPatents.length - 1) {
      const newIndex = currentDetailIndex + 1;
      updateDetailView(rawPatents[newIndex], newIndex);
    }
  };

  // Fetch titles from API
  useEffect(() => {
    const fetchTitles = async () => {
      try {
        console.log('🔄 Fetching titles for search...');
        const result = await titleAPI.getAll();

        if (result.data) {
          let titles: any[] = [];
          // Robust extraction logic
          if (result.data.data && Array.isArray(result.data.data.titles)) {
            titles = result.data.data.titles;
          } else if (result.data.titles && Array.isArray(result.data.titles)) {
            titles = result.data.titles;
          } else if (result.data.data && Array.isArray(result.data.data)) {
            titles = result.data.data;
          } else if (Array.isArray(result.data)) {
            titles = result.data;
          }

          setSearchResults(titles.map((t: any, idx: number) => ({
            id: t.id,
            no: t.no || t.titleNo || `000${idx + 1}`,
            title: t.title || t.titleName || t.name,
            dataCount: Number(t.dataCount || t.patentCount || 0),
            department: t.department || '',
            responsible: t.responsible || t.creator || ''
          })));
        }
      } catch (err) {
        console.error('❌ Error fetching titles:', err);
      } finally {
        setIsLoadingTitles(false);
      }
    };
    fetchTitles();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTitles(searchResults.map((r: SearchResult) => r.id));
    } else {
      setSelectedTitles([]);
    }
  };

  const handleSelectTitle = (titleNo: string, checked: boolean) => {
    if (checked) {
      setSelectedTitles([...selectedTitles, titleNo]);
    } else {
      setSelectedTitles(selectedTitles.filter((no: string) => no !== titleNo));
    }
  };

  const handleCountCheck = async () => {
    if (selectedTitles.length === 0) {
      notifyWarning('タイトルを選択してください');
      return;
    }

    setIsLoadingPatents(true);
    setPatentCount(0);
    setPatentListData([]);
    setRawPatents([]);
    setPatentDetail({
      titleCode: '',
      titleName: '',
      publicationNo: '',
      registrationNo: '',
      applicant: '',
      inventionName: '',
      abstract: '',
      claims: '',
      inventor: '',
      ipc: '',
      applicationNo: '',
      applicationDate: '',
      publicationDate: '',
      registrationDate: '',
      fi: '',
      fTerm: '',
      publicationType: ''
    });
    try {
      let criteria: any = {
        mode: searchMethod,
        titleIds: selectedTitles
      };

      if (searchMethod === 'number') {
        const numbers = numberInput.split(/[\n\s,]+/).map(s => s.trim()).filter(s => s !== '');
        if (numbers.length === 0) {
          notifyWarning('番号を入力してください');
          setIsLoadingPatents(false);
          return;
        }
        criteria.numbers = numbers;
        criteria.numberType = numberType;
        criteria.searchOption = searchOption;
      } else {
        // Condition search
        if (!searchExpression) {
          notifyWarning('検索式を入力してください');
          setIsLoadingPatents(false);
          return;
        }

        const conditions: Record<string, { field: string; value: string }> = {};
        historyItems.forEach(item => {
          conditions[item.id] = { field: item.field, value: item.value };
        });

        criteria.expression = searchExpression;
        criteria.conditions = conditions;
      }

      console.log('🔍 Searching with criteria:', criteria);
      const result = await patentAPI.search(criteria);

      if (result.data) {
        const data = result.data.data || result.data;
        setPatentCount(data.count || 0);
        const patents = data.patents || [];
        setRawPatents(patents);

        setPatentListData(patents.map((p: any) => ({
          documentNo: p.documentNum || '',
          applicationNo: p.applicationNum || '',
          applicationDate: p.applicationDate ? new Date(p.applicationDate).toLocaleDateString() : '',
          publicationDate: p.publicationDate ? new Date(p.publicationDate).toLocaleDateString() : '',
          inventionName: p.inventionTitle || '',
          applicant: p.applicantName || '',
          publicationNo: p.publicationNum || '',
          announcementNo: p.announcementNum || '',
          registrationNo: p.registrationNum || '',
          trialNo: p.appealNum || '',
          other: p.otherInfo || '',
          stage: p.statusStage || '',
          event: p.eventDetail || '',
          documentUrl: p.documentUrl || ''
        })));

        // Set the first patent as the default detail view
        if (patents.length > 0) {
          updateDetailView(patents[0], 0);
        }

        notifyInfo(`${data.count || 0}件の案件が見つかりました`);
      } else if (result.error) {
        notifyError('検索エラー', result.error);
      }
    } catch (error) {
      console.error('Search error:', error);
      notifyError('検索中にエラーが発生しました');
    } finally {
      setIsLoadingPatents(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedTitles.length === 0) {
      notifyWarning('タイトルを選択してください');
      return;
    }
    const total = searchResults
      .filter(r => selectedTitles.includes(r.id))
      .reduce((sum, r) => sum + r.dataCount, 0);
    setTotalSelectedCount(total);
  };

  const handleRowClick = (patent: PatentListItem) => {
    // We need to find the raw patent data to populate details (abstract, claims etc)
    const index = rawPatents.findIndex(p => p.documentNum === patent.documentNo);
    if (index !== -1) {
      updateDetailView(rawPatents[index], index);
      setShowDetailDialog(true);
    }
  };

  const handleAddHistory = () => {
    if (!searchNameValue) {
      notifyWarning('検索値を入力してください');
      return;
    }

    const fieldLabels: Record<string, string> = {
      'document': '文献番号',
      'application': '出願番号',
      'applicationDate': '出願日',
      'publicationDate': '公知日',
      'inventionName': '発明の名称',
      'applicant': '出願人/権利者'
    };

    const newItem: HistoryItem = {
      id: `S${nextHistoryId}`,
      name: fieldLabels[searchNameField] || searchNameField,
      value: searchNameValue,
      field: searchNameField
    };

    setHistoryItems([...historyItems, newItem]);
    setNextHistoryId(nextHistoryId + 1);
    setSearchNameValue(''); // Clear input
  };

  const handleDeleteHistory = (id: string) => {
    setHistoryItems(historyItems.filter((item: HistoryItem) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryItems([]);
    setNextHistoryId(1);
    setSearchExpression('');
  };

  const handleAddToExpression = (text: string) => {
    setSearchExpression(prev => prev + text);
  };

  const handleHistoryClick = (id: string) => {
    setSearchExpression(prev => {
      // Add space if not empty and last char is not an operator or bracket start
      const lastChar = prev.slice(-1);
      const needsSpace = prev.length > 0 && !['+', '×', '(', '['].includes(lastChar);
      // Actually, logic is simpler: just append. User handles syntax.
      // But maybe we can be smart.
      return prev + id;
    });
  };

  const handleExport = async () => {
    if (patentCount === 0) {
      notifyWarning('出力するデータがありません');
      return;
    }

    let criteria: any = {
      mode: searchMethod,
      titleIds: selectedTitles.length > 0 ? selectedTitles : undefined
    };

    if (searchMethod === 'number') {
      const numbers = numberInput.split(/[\n\s,]+/).map(s => s.trim()).filter(s => s !== '');
      if (numbers.length === 0) {
        notifyWarning('番号を入力してください');
        return;
      }
      criteria.numbers = numbers;
      criteria.numberType = numberType;
      criteria.searchOption = searchOption;
    } else {
      if (!searchExpression) {
        notifyWarning('検索式を入力してください');
        return;
      }

      const conditions: Record<string, { field: string; value: string }> = {};
      historyItems.forEach(item => {
        conditions[item.id] = { field: item.field, value: item.value };
      });

      criteria.expression = searchExpression;
      criteria.conditions = conditions;
    }

    try {
      const result = await importExportAPI.exportSearchResults(criteria, 'csv');
      if (result.error) {
        notifyError('出力エラー', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      notifyError('出力中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Buttons */}
      <div className="flex justify-between items-center">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-6 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            タイトル一覧へ戻る
          </Button>
        )}
        <Button
          variant="outline"
          className="border-2 border-gray-400 bg-white hover:bg-gray-50 px-6 ml-auto dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          条件をクリア
        </Button>
      </div>

      {/* Section 1: 検索方法 */}
      <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
        <div className="p-4">
          <div className="mb-4">
            <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">検索方法</span>
          </div>
          <RadioGroup value={searchMethod} onValueChange={setSearchMethod} className="flex gap-4">
            <div className="flex items-center space-x-2 p-2 rounded border-2 border-black bg-white dark:bg-slate-800 dark:border-slate-600">
              <RadioGroupItem value="number" id="number" className="border-2 border-black dark:border-slate-400 dark:text-orange-500" />
              <Label htmlFor="number" className="cursor-pointer text-sm dark:text-slate-200">番号を入力して検索</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded border-2 border-black bg-white dark:bg-slate-800 dark:border-slate-600">
              <RadioGroupItem value="condition" id="condition" className="border-2 border-black dark:border-slate-400 dark:text-orange-500" />
              <Label htmlFor="condition" className="cursor-pointer text-sm dark:text-slate-200">条件を入力して検索</Label>
            </div>
          </RadioGroup>
        </div>
      </Card>

      {/* Conditional Content Based on Search Method */}
      {searchMethod === 'number' ? (
        // 番号を入力して検索 UI - Same format as 条件を入力して検索
        <div className="space-y-4">
          {/* タイトル指定 Section */}
          <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4">
              <div className="mb-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">タイトル指定</span>
              </div>

              {/* Header */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-slate-300">用途:</span>
                  <Select defaultValue="patent">
                    <SelectTrigger className="bg-white border border-gray-300 h-7 w-24 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patent">特許</SelectItem>
                      <SelectItem value="design">意匠</SelectItem>
                      <SelectItem value="trademark">商標</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-slate-300">検索済み件数: {totalSelectedCount} 件</span>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                    onClick={handleConfirmSelection}
                  >
                    確認
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-600 mb-3 dark:text-slate-400">
                ※確認した範囲をまず確定してください。からのタイトルから選んでください。
              </div>

              {/* Table */}
              <Card className="border-2 border-gray-300 bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-600">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800">
                      <TableHead className="w-[60px] border-r text-xs text-center dark:border-slate-700 dark:text-slate-300">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={selectedTitles.length === searchResults.length && searchResults.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-[9px]">全ON/OFF</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] border-r text-xs text-center dark:border-slate-700 dark:text-slate-300">No.</TableHead>
                      <TableHead className="border-r text-xs dark:border-slate-700 dark:text-slate-300">保存データタイトル</TableHead>
                      <TableHead className="w-[130px] border-r text-xs dark:border-slate-700 dark:text-slate-300">データ件数</TableHead>
                      <TableHead className="w-[120px] border-r text-xs dark:border-slate-700 dark:text-slate-300">部署名</TableHead>
                      <TableHead className="w-[130px] text-xs dark:text-slate-300">主担当者</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result) => (
                      <TableRow key={result.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                        <TableCell className="border-r text-center dark:border-slate-700">
                          <Checkbox
                            checked={selectedTitles.includes(result.id)}
                            onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectTitle(result.id, typeof checked === 'boolean' ? checked : false)}
                          />
                        </TableCell>
                        <TableCell className="border-r text-xs text-center dark:border-slate-700 dark:text-slate-200">{result.no}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{result.title}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{result.dataCount}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{result.department}</TableCell>
                        <TableCell className="text-xs dark:text-slate-200">{result.responsible}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </Card>

          {/* 番号入力 Section */}
          <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4">
              <div className="mb-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">番号入力</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-[200px]">
                    <Label className="text-sm mb-2 block dark:text-slate-200">番号区分</Label>
                    <Select value={numberType} onValueChange={setNumberType}>
                      <SelectTrigger className="bg-white border-2 border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="publication">公開・公表番号</SelectItem>
                        <SelectItem value="application">出願番号</SelectItem>
                        <SelectItem value="registration">登録番号</SelectItem>
                        <SelectItem value="gazette">広報番号</SelectItem>
                        <SelectItem value="idea">アイデア番号</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label className="text-sm mb-2 block invisible">入力</Label>
                    <Textarea
                      className="min-h-[100px] bg-white border-2 border-gray-300 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                      placeholder="特開2025-040365"
                      value={numberInput}
                      onChange={(e) => setNumberInput(e.target.value)}
                    />
                  </div>

                  <div className="w-[200px]">
                    <Label className="text-sm mb-2 block dark:text-slate-200">検索オプション</Label>
                    <RadioGroup value={searchOption} onValueChange={setSearchOption} className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 rounded border-2 border-black bg-white dark:bg-slate-800 dark:border-slate-600">
                        <RadioGroupItem value="exact" id="exact" className="border-2 border-black dark:border-slate-400 dark:text-orange-500" />
                        <Label htmlFor="exact" className="cursor-pointer text-sm dark:text-slate-200">完全一致</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded border-2 border-black bg-white dark:bg-slate-800 dark:border-slate-600">
                        <RadioGroupItem value="partial" id="partial" className="border-2 border-black dark:border-slate-400 dark:text-orange-500" />
                        <Label htmlFor="partial" className="cursor-pointer text-sm dark:text-slate-200">部分一致</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Count Check Section */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleCountCheck}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 dark:bg-orange-600 dark:hover:bg-orange-700"
                  >
                    件数チェック
                  </Button>
                  <div className="flex items-center gap-2">
                    <Input
                      value={patentCount > 0 ? patentCount : ''}
                      readOnly
                      className="w-24 text-center border-2 border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                      placeholder="0"
                    />
                    <span className="text-sm dark:text-slate-200">件</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // 条件を入力して検索 UI
        <div className="space-y-4">
          {/* タイトル指定 Section */}
          <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4">
              <div className="mb-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">タイトル指定</span>
              </div>

              {/* Header */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-slate-300">用途:</span>
                  <Select defaultValue="patent">
                    <SelectTrigger className="bg-white border border-gray-300 h-7 w-24 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patent">特許</SelectItem>
                      <SelectItem value="design">意匠</SelectItem>
                      <SelectItem value="trademark">商標</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs dark:text-slate-300">検索済み件数：{totalSelectedCount} 件</span>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                    onClick={handleConfirmSelection}
                  >
                    確認
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-600 mb-3 dark:text-slate-400">
                ※確認した範囲をまず確定してください。からのタイトルから選んでください。
              </div>

              {/* Table */}
              <Card className="border-2 border-gray-300 bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-600">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800">
                      <TableHead className="w-[60px] border-r text-xs text-center dark:border-slate-700 dark:text-slate-300">
                        <div className="flex flex-col items-center gap-1">
                          <Checkbox
                            checked={selectedTitles.length === searchResults.length && searchResults.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-[9px]">全ON/OFF</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] border-r text-xs text-center dark:border-slate-700 dark:text-slate-300">No.</TableHead>
                      <TableHead className="border-r text-xs dark:border-slate-700 dark:text-slate-300">保存データタイトル</TableHead>
                      <TableHead className="w-[130px] border-r text-xs dark:border-slate-700 dark:text-slate-300">データ件数</TableHead>
                      <TableHead className="w-[120px] border-r text-xs dark:border-slate-700 dark:text-slate-300">部署名</TableHead>
                      <TableHead className="w-[130px] text-xs dark:text-slate-300">主担当者</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result) => (
                      <TableRow key={result.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                        <TableCell className="border-r text-center dark:border-slate-700">
                          <Checkbox
                            checked={selectedTitles.includes(result.id)}
                            onCheckedChange={(checked: boolean | 'indeterminate') => handleSelectTitle(result.id, typeof checked === 'boolean' ? checked : false)}
                          />
                        </TableCell>
                        <TableCell className="border-r text-xs text-center dark:border-slate-700 dark:text-slate-200">{result.no}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{result.title}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{result.dataCount}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{result.department}</TableCell>
                        <TableCell className="text-xs dark:text-slate-200">{result.responsible}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </Card>

          {/* 名称かリスト Section */}
          <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4">
              <div className="mb-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">名称かリスト</span>
              </div>

              {/* Input Row */}
              <div className="flex items-end gap-2 mb-4">
                <div className="flex-1">
                  <Label className="text-xs mb-1 block dark:text-slate-200">検索名称</Label>
                  <div className="flex gap-2">
                    <Select value={searchNameField} onValueChange={setSearchNameField}>
                      <SelectTrigger className="bg-white border border-gray-300 h-8 w-[180px] text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">文献番号</SelectItem>
                        <SelectItem value="application">出願番号</SelectItem>
                        <SelectItem value="applicationDate">出願日</SelectItem>
                        <SelectItem value="publicationDate">公知日</SelectItem>
                        <SelectItem value="inventionName">発明の名称</SelectItem>
                        <SelectItem value="applicant">出願人/権利者</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="bg-white border border-gray-300 h-8 text-xs flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                      value={searchNameValue}
                      onChange={(e) => setSearchNameValue(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-4 bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
                      onClick={handleAddHistory}
                    >
                      追加
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-600 mb-3 dark:text-slate-400">
                ※履歴かリストでクリックして編集元に履歴を追加してください。
              </div>

              {/* History Table - Updated with new column names */}
              <div className="border-2 border-gray-300 bg-white rounded overflow-hidden dark:bg-slate-900 dark:border-slate-600">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-800">
                      <TableHead className="w-[80px] border-r text-xs text-center dark:border-slate-700 dark:text-slate-300">選択</TableHead>
                      <TableHead className="w-[150px] border-r text-xs dark:border-slate-700 dark:text-slate-300">項目</TableHead>
                      <TableHead className="border-r text-xs dark:border-slate-700 dark:text-slate-300">条件</TableHead>
                      <TableHead className="w-[80px] text-xs text-center dark:text-slate-300">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                          onClick={handleClearAllHistory}
                        >
                          全削除
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                        <TableCell className="border-r text-xs text-center dark:border-slate-700">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 hover:underline dark:text-blue-400"
                            onClick={() => handleHistoryClick(item.id)}
                          >
                            {item.id}
                          </Button>
                        </TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{item.name}</TableCell>
                        <TableCell className="border-r text-xs dark:border-slate-700 dark:text-slate-200">{item.value}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                            onClick={() => handleDeleteHistory(item.id)}
                          >
                            削除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>

          {/* 検索式 Section */}
          <Card className="border-2 border-orange-200 bg-orange-50/30 dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4">
              <div className="mb-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm">検索式</span>
              </div>

              <div className="space-y-3">
                <Input
                  value={searchExpression}
                  onChange={(e) => setSearchExpression(e.target.value)}
                  className="bg-white border border-gray-300 h-8 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 border-gray-300 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => setSearchExpression('')}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 border-gray-300 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleAddToExpression('[')}
                  >
                    [
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 border-gray-300 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleAddToExpression(']')}
                  >
                    ]
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 border-gray-300 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleAddToExpression('×')}
                  >
                    ×
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 border-gray-300 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleAddToExpression('+')}
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-4 border-gray-300 text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleAddToExpression('Not')}
                  >
                    Not
                  </Button>
                </div>

                {/* Count Check at bottom of 検索式 */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleCountCheck}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 dark:bg-orange-600 dark:hover:bg-orange-700"
                  >
                    件数チェック
                  </Button>
                  <div className="flex items-center gap-2">
                    <Input
                      value={patentCount > 0 ? patentCount : ''}
                      readOnly
                      className="w-24 text-center border-2 border-gray-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                      placeholder="0"
                    />
                    <span className="text-sm dark:text-slate-200">件</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex gap-3 justify-center pt-4 border-t-2 border-gray-200 dark:border-slate-700">
        <Button
          variant="outline"
          onClick={() => setShowDetailDialog(true)}
          className="border-2 border-orange-400 bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 px-12 h-10 text-sm min-w-[150px] dark:bg-slate-800 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-slate-700 dark:from-slate-800 dark:to-slate-800"
        >
          案件詳細
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowListDialog(true)}
          className="border-2 border-orange-400 bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 px-12 h-10 text-sm min-w-[150px] dark:bg-slate-800 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-slate-700 dark:from-slate-800 dark:to-slate-800"
        >
          案件一覧
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="border-2 border-orange-400 bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 px-12 h-10 text-sm min-w-[150px] dark:bg-slate-800 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-slate-700 dark:from-slate-800 dark:to-slate-800"
        >
          出力
        </Button>
      </div>

      {/* Patent Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader className="border-b pb-4 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  書誌・明細書
                </span>
                <span className="text-sm text-gray-500 ml-2 dark:text-slate-400">
                  ({currentDetailIndex + 1} / {rawPatents.length})
                </span>
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPatent}
                  disabled={currentDetailIndex === 0}
                  className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPatent}
                  disabled={currentDetailIndex === rawPatents.length - 1}
                  className="dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  次へ
                </Button>
              </div>
            </div>
            <DialogDescription className="sr-only">
              特許案件の詳細情報を表示します
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-4">
              {/* Basic Info Section */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50/30 rounded border border-orange-200 dark:bg-slate-800 dark:border-slate-700">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">タイトルコード</Label>
                  <p className="text-sm mt-1 dark:text-slate-200">{patentDetail.titleCode}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">タイトル名</Label>
                  <p className="text-sm mt-1 dark:text-slate-200">{patentDetail.titleName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">公開・公表番号</Label>
                  <p className="text-sm mt-1 dark:text-slate-200">{patentDetail.publicationNo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">登録番号</Label>
                  <p className="text-sm mt-1 dark:text-slate-200">{patentDetail.registrationNo}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-600 dark:text-slate-400">権利者･出願人名</Label>
                  <p className="text-sm mt-1 dark:text-slate-200">{patentDetail.applicant}</p>
                </div>
              </div>

              {/* Invention Name */}
              <div className="p-4 bg-white rounded border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">送信</Button>
                  <Label className="text-sm dark:text-slate-200">発明の名称</Label>
                </div>
                <p className="text-sm dark:text-slate-200">{patentDetail.inventionName}</p>
              </div>

              {/* Abstract */}
              <div className="p-4 bg-white rounded border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">送信</Button>
                  <Label className="text-sm dark:text-slate-200">要約</Label>
                </div>
                <div className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded dark:bg-slate-900 dark:text-slate-200">
                  {patentDetail.abstract}
                </div>
              </div>

              {/* Claims */}
              <div className="p-4 bg-white rounded border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">送信</Button>
                  <Label className="text-sm dark:text-slate-200">請求の範囲</Label>
                </div>
                <div className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded max-h-60 overflow-y-auto dark:bg-slate-900 dark:text-slate-200">
                  {patentDetail.claims}
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50/30 rounded border border-orange-200 dark:bg-slate-800 dark:border-slate-700">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">発明者名</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.inventor}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">IPC</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.ipc}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">出願番号</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.applicationNo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">出願日</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.applicationDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">公開・公表日</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.publicationDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">登録日</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.registrationDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">FI</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.fi}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">Fターム</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.fTerm}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 dark:text-slate-400">公報種別</Label>
                  <p className="text-xs mt-1 dark:text-slate-200">{patentDetail.publicationType}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Patent List Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader className="border-b pb-3 px-4 pt-4 dark:border-slate-700">
            <DialogTitle className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                案件一覧
              </span>
              <span className="text-sm text-gray-500 dark:text-slate-400">({patentListData.length}件)</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              検索結果の特許案件一覧を表示します
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto px-4 pb-4">
            <Table className="border border-gray-300 dark:border-slate-700">
              <TableHeader>
                <TableRow className="bg-orange-100 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-800">
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">文献番号</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">出願番号</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">出願日</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">公知日</TableHead>
                  <TableHead className="border-r text-xs px-3 py-2 dark:border-slate-700 dark:text-slate-300">発明の名称</TableHead>
                  <TableHead className="border-r text-xs px-3 py-2 dark:border-slate-700 dark:text-slate-300">出願人/権利者</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">公開番号</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">公告番号</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">登録番号</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">審判番号</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">その他</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">ステージ</TableHead>
                  <TableHead className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-300">イベント</TableHead>
                  <TableHead className="text-xs px-3 py-2 dark:text-slate-300">文献URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patentListData.map((patent, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-orange-50 cursor-pointer dark:hover:bg-slate-800"
                    onClick={() => handleRowClick(patent)}
                  >
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.documentNo}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.applicationNo}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.applicationDate}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.publicationDate}</TableCell>
                    <TableCell className="border-r text-xs px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.inventionName}</TableCell>
                    <TableCell className="border-r text-xs px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.applicant}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.publicationNo}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.announcementNo}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.registrationNo}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.trialNo}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.other}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.stage}</TableCell>
                    <TableCell className="border-r text-xs whitespace-nowrap px-3 py-2 dark:border-slate-700 dark:text-slate-200">{patent.event}</TableCell>
                    <TableCell className="text-xs px-3 py-2">
                      <a href={patent.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all dark:text-blue-400">
                        {patent.documentUrl}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
