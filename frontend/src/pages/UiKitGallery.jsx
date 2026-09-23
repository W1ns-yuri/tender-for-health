import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableEmptyState,
  Alert,
  StatCard,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  Tabs,
  Pagination,
  SearchInput,
  SkeletonTable,
  FileDropzone,
} from '../components/ui';

import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  Building,
  Sparkles,
} from 'lucide-react';

export default function UiKitGallery() {
  // State for interactive demonstrations
  const [btnLoading, setBtnLoading] = useState(false);
  const [inputValue, setInputValue] = useState('Winfinity Tech');
  const [selectedCurrency, setSelectedCurrency] = useState('TMT');
  const [activeTab, setActiveTab] = useState('pills');
  const [activeSegment, setActiveSegment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mockFile, setMockFile] = useState(null);
  const [showEmptyTable, setShowEmptyTable] = useState(false);

  const sampleTableData = [
    { id: 1, name: 'Parasetamol 500mg', code: 'MED-001', qty: '10,000 sany', price: '4.50 TMT', status: 'emerald', statusLabel: 'Ýeňiji' },
    { id: 2, name: 'Amoksisillin 250mg', code: 'MED-002', qty: '5,000 sany', price: '12.00 TMT', status: 'amber', statusLabel: 'Garaşylýar' },
    { id: 3, name: 'Ultrasound Scan Unit X1', code: 'EQ-990', qty: '2 sany', price: '145,000 TMT', status: 'blue', statusLabel: 'Barlagda' },
    { id: 4, name: 'Lukmançylyk ellikleri M', code: 'DISP-11', qty: '50,000 jübüt', price: '0.80 TMT', status: 'rose', statusLabel: 'Ret edildi' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
            <Sparkles size={14} />
            <span>Tender Ulgamy • UI Kit & Design System v2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Ýeke-täk dizaýn ulgamy we UI komponentler
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Taslamanyň ähli sahypalarynda (Aşgabat, Saglygy goraýyş ministrligi, Analitika, Tenderler) dizaýn birligini üpjün edýän tassyklanan komponentler toplumy.
          </p>
        </div>
      </div>

      {/* 1. STAT CARDS (METRICS FOR ANALYTICS & DASHBOARD) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          1. Analitiki Metrika Kartlary (Stat Cards)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Jemi söwdalar"
            value="128"
            icon={<FileText size={20} />}
            color="blue"
            trend={{ value: '+14.2%', direction: 'up', isPositive: true }}
            subtitle="Geçen aýa görä ýokarlanma"
          />
          <StatCard
            title="Umumy dolanyşyk"
            value="4,850,200 TMT"
            icon={<DollarSign size={20} />}
            color="emerald"
            trend={{ value: '+8.5%', direction: 'up', isPositive: true }}
            subtitle="Döwlet tenderleriniň möçberi"
          />
          <StatCard
            title="Hasaba alnan üpjün edijiler"
            value="342"
            icon={<Building size={20} />}
            color="purple"
            trend={{ value: '+24', direction: 'up', isPositive: true }}
            subtitle="Barlagdan geçen kompaniýalar"
          />
          <StatCard
            title="Barlagda garaşýanlar"
            value="12"
            icon={<Users size={20} />}
            color="amber"
            trend={{ value: '-3', direction: 'down', isPositive: false }}
            subtitle="Moderator tassyklamasy"
          />
        </div>
      </section>

      {/* 2. BUTTONS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          2. Düwmeler (Button Variants & Sizes)
        </h2>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Standart Düwmeler (Button Variants)</CardTitle>
              <CardDescription>Ähli reňk wariantlary, ölçegleri we animasiýalary</CardDescription>
            </div>
            <CardAction>
              <Badge variant="blue">7 Wariant</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3">Wariantlar:</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Plus size={16} />}>Primary (Blue)</Button>
                <Button variant="success" leftIcon={<CheckCircle2 size={16} />}>Success (Emerald)</Button>
                <Button variant="danger" leftIcon={<Trash2 size={16} />}>Danger (Rose)</Button>
                <Button variant="warning" leftIcon={<AlertCircle size={16} />}>Warning (Amber)</Button>
                <Button variant="secondary">Secondary (Slate)</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3">Ölçegler & Ýükleme:</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs" variant="primary">Extra Small</Button>
                <Button size="sm" variant="primary">Small</Button>
                <Button size="md" variant="primary">Medium (Def)</Button>
                <Button size="lg" variant="primary">Large</Button>
                <Button
                  variant="success"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1500);
                  }}
                >
                  {btnLoading ? 'Ýüklenýär...' : 'Klikläň (Spinner testi)'}
                </Button>
                <Button size="icon-sm" variant="outline" title="Düzetmek"><Edit2 size={14} /></Button>
                <Button size="icon-sm" variant="danger" title="Aýyrmak"><Trash2 size={14} /></Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-slate-400">Tailwind CSS v4 & Lucide Icons</span>
            <Button size="xs" variant="outline">Gözden geçirmek</Button>
          </CardFooter>
        </Card>
      </section>

      {/* 3. INPUTS & FORM ELEMENTS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          3. Maglumat girizilýän meýdanlar (Input, Select, Textarea)
        </h2>
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input
                label="Kompaniýanyň ady"
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                clearable
                onClear={() => setInputValue('')}
                hint="Resmi şahadatnama boýunça"
              />

              <Input
                label="Salgyt belgisi (STŞK / OKPO)"
                mono
                defaultValue="12345678"
                leftIcon={<Building size={16} />}
                hint="8 sifrli mono meýdan"
              />

              <Select
                label="Walýuta"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                options={[
                  { value: 'TMT', label: 'TMT — Türkmen manady' },
                  { value: 'USD', label: 'USD — ABŞ dollary' },
                  { value: 'EUR', label: 'EUR — Ýewro' },
                ]}
              />

              <Input
                label="Ýalňyş meýdan nusgasy"
                defaultValue="invalid_email"
                error="Girizilen email dogry däl"
              />

              <SearchInput
                placeholder="Harytlary gözläň..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={(q) => console.log('Searching:', q)}
              />

              <div className="md:col-span-3">
                <Textarea
                  label="Goşmaça düşündiriş ýa-da şertler"
                  rows={2}
                  maxLength={300}
                  showCount
                  defaultValue="Tender boýunça ähli harytlar lukmançylyk güwänamalaryna laýyk bolmaly."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. BADGES & ALERTS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          4. Status belgileri we Duýduryşlar (Badges & Alerts)
        </h2>
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3">Status Badges (Pulsing & Static):</h4>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="emerald" pulse>Aktiw tender</Badge>
                <Badge variant="emerald" icon={<CheckCircle2 size={12} />}>Tassyklanan</Badge>
                <Badge variant="amber" pulse>Barlagda</Badge>
                <Badge variant="amber" dot>Garaşylýar</Badge>
                <Badge variant="rose" dot>Ret edildi</Badge>
                <Badge variant="blue">Täze teklip</Badge>
                <Badge variant="purple">Analitika</Badge>
                <Badge variant="cyan">Eksport</Badge>
                <Badge variant="slate">Arhiw</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert
                variant="info"
                title="Maglumat habarnamasy"
                description="Tender boýunça resminamalary barlamak işi alnyp barylýar. Ýeňiji 3 günüň içinde kesgitlener."
              />

              <Alert
                variant="success"
                title="Üstünlikli ýatda saklandy"
                description="Teklibiňiz söwda ulgamyna kabul edildi we şifrirlendi."
              />

              <Alert
                variant="warning"
                title="Ygtyýarnama möhleti gutarýar"
                description="Kompaniýaňyzyň lukmançylyk ygtyýarnamasynyň möhletine 15 gün galdy."
              />

              <Alert
                variant="danger"
                title="Ýalňyşlyk ýüze çykdy"
                description="Bellenen summanyň möçberi tender çäginden geçýär."
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. TABS & SEGMENTED CONTROLS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          5. Saýlaw panelleri (Tabs)
        </h2>
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-2">Pills wariant:</h4>
              <Tabs
                variant="pills"
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: 'pills', label: 'Ähli lotlar', count: 8 },
                  { id: 'won', label: 'Utulanlar', count: 3 },
                  { id: 'active', label: 'Dowam edýänler', count: 5 },
                  { id: 'archive', label: 'Arhiw', count: 0 },
                ]}
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-2">Segmented wariant:</h4>
              <Tabs
                variant="segmented"
                size="sm"
                activeTab={activeSegment}
                onChange={setActiveSegment}
                tabs={[
                  { id: 'all', label: 'Ählisi' },
                  { id: 'pharma', label: 'Dermanlar' },
                  { id: 'equipment', label: 'Enjamlar' },
                  { id: 'consumables', label: 'Sarp ediş serişdeleri' },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. TABLE COMPONENT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            6. Standartlaşdyrylan Tablisa (Table & Pagination)
          </h2>
          <Button
            size="xs"
            variant="outline"
            onClick={() => setShowEmptyTable(!showEmptyTable)}
          >
            {showEmptyTable ? 'Maglumatly görnüş' : 'Boş tablisa (Empty state)'}
          </Button>
        </div>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell sortable>Harydyň ady</TableHeaderCell>
                <TableHeaderCell>Kody</TableHeaderCell>
                <TableHeaderCell align="center">Mukdary</TableHeaderCell>
                <TableHeaderCell align="right" sortable>Bahasy</TableHeaderCell>
                <TableHeaderCell align="center">Status</TableHeaderCell>
                <TableHeaderCell align="right">Hereket</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {showEmptyTable ? (
                <TableEmptyState
                  colSpan={6}
                  title="Haryt tapylmady"
                  description="Gözleg boýunça hiç hili derman serişdesi ýa-da lukmançylyk enjamy tapylmady."
                  action={
                    <Button size="sm" variant="primary" leftIcon={<Plus size={14} />}>
                      Täze haryt goşmak
                    </Button>
                  }
                />
              ) : (
                sampleTableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{row.code}</TableCell>
                    <TableCell align="center">{row.qty}</TableCell>
                    <TableCell align="right" className="font-mono font-bold text-slate-900 dark:text-slate-100">{row.price}</TableCell>
                    <TableCell align="center">
                      <Badge variant={row.status} size="sm">{row.statusLabel}</Badge>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="icon-sm" variant="ghost" title="Görmek"><Eye size={14} /></Button>
                        <Button size="icon-sm" variant="ghost" title="Düzetmek"><Edit2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={4}
            totalItems={38}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </TableContainer>
      </section>

      {/* 7. FILE DROPZONE */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          7. Resminama ýükleýiş zolagy (File Dropzone)
        </h2>
        <Card>
          <CardContent>
            <FileDropzone
              file={mockFile}
              onFileSelect={(f) => setMockFile(f)}
              onFileRemove={() => setMockFile(null)}
              title="Lukmançylyk ygtyýarnamasyny ýükläň"
              subtitle="PDF, DOCX ýa-da skan surat (25MB çenli)"
            />
          </CardContent>
        </Card>
      </section>

      {/* 8. MODALS & CONFIRM DIALOGS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          8. Modallar we Tassyklama penjireleri (Modals & Dialogs)
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Standart Modaly açmak
              </Button>

              <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                Pozmak tassyklama penjiresini açmak
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 9. SKELETON LOADERS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          9. Ýükleniş skeletleri (Skeleton Loaders)
        </h2>
        <SkeletonTable rows={3} cols={4} />
      </section>

      {/* Interactive Modal Demo */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          <ModalTitle>Täze barlag maglumaty</ModalTitle>
          <ModalDescription>Ulgama täze şahamça ýa-da resminama goşmak</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input label="Bölümiň ady" placeholder="Mysal: Derman serişdeleri ammary" />
          <Select
            label="Jogapkär şahs"
            options={[
              { value: '1', label: 'Orazow Maksat (Direktor)' },
              { value: '2', label: 'Amanowa Maral (Baş buhgalter)' },
            ]}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Ýatyr</Button>
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>Goşmak</Button>
        </ModalFooter>
      </Modal>

      {/* Interactive Confirm Dialog Demo */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          alert('Hereket tassyklandy!');
        }}
        title="Lody aýyrmak"
        message="Siz hakykatdan hem bu lody we oňa degişli spensifikasiýa setirlerini aýyrmak isleýärsiňizmi? Bu hereketi yzyna gaýtaryp bolmaýar."
        confirmText="Hawa, aýyr"
        cancelText="Ýatyr"
        variant="danger"
      />
    </div>
  );
}

function Eye(props) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
