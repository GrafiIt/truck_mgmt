"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ArrowLeft, Pencil, Key, Lock } from "lucide-react"
import { masterAdminLogin, getCompanies, addCompany, deleteCompany, updateCompany, changeMasterPassword, changeCompanyAdminPassword } from "./actions"

interface Company {
  company_code: string
  company_name: string
  created_at: string
  phone?: string
  email?: string
  business_number?: string
  address?: string
}

export default function MasterAdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [masterUsername, setMasterUsername] = useState("")
  const [masterPassword, setMasterPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [companies, setCompanies] = useState<Company[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newCompanyCode, setNewCompanyCode] = useState("")
  const [newCompanyName, setNewCompanyName] = useState("")
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteCompanyCode, setDeleteCompanyCode] = useState("")
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState("")
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isChangeMasterPasswordOpen, setIsChangeMasterPasswordOpen] = useState(false)
  const [newMasterPassword, setNewMasterPassword] = useState("")
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState("")
  const [isChangeCompanyPasswordOpen, setIsChangeCompanyPasswordOpen] = useState(false)
  const [selectedCompanyCode, setSelectedCompanyCode] = useState("")
  const [newCompanyPassword, setNewCompanyPassword] = useState("")
  const [confirmNewCompanyPassword, setConfirmNewCompanyPassword] = useState("")

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsLoading(true)

    try {
      const result = await masterAdminLogin(masterUsername, masterPassword)
      if (result.success) {
        setIsAuthenticated(true)
        await loadCompanies()
      } else {
        setLoginError(result.error || "로그인 실패")
      }
    } catch (err) {
      setLoginError("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCompanies = async () => {
    try {
      const result = await getCompanies()
      if (result.success && result.companies) {
        setCompanies(result.companies)
      } else {
        setError(result.error || "기업 목록을 불러오지 못했습니다.")
      }
    } catch (err) {
      setError("기업 목록을 불러오는 중 오류가 발생했습니다.")
    }
  }

  const handleAddCompany = async () => {
    if (!newCompanyCode || !newCompanyName) {
      setError("기업코드와 기업명을 모두 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await addCompany(newCompanyCode, newCompanyName)
      if (result.success) {
        setIsAddDialogOpen(false)
        setNewCompanyCode("")
        setNewCompanyName("")
        await loadCompanies()
      } else {
        setError(result.error || "기업 추가 실패")
      }
    } catch (err) {
      setError("기업 추가 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCompany = async () => {
    if (!editCompany) return

    setIsLoading(true)
    setError("")

    try {
      const result = await updateCompany(
        editCompany.company_code,
        editCompany.company_name,
        editCompany.phone,
        editCompany.email,
        editCompany.business_number,
        editCompany.address
      )
      if (result.success) {
        setIsEditDialogOpen(false)
        setEditCompany(null)
        await loadCompanies()
      } else {
        setError(result.error || "기업 수정 실패")
      }
    } catch (err) {
      setError("기업 수정 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeMasterPassword = async () => {
    if (!newMasterPassword || !confirmNewMasterPassword) {
      setError("새 비밀번호를 입력해주세요.")
      return
    }

    if (newMasterPassword !== confirmNewMasterPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await changeMasterPassword(newMasterPassword)
      if (result.success) {
        setIsChangeMasterPasswordOpen(false)
        setNewMasterPassword("")
        setConfirmNewMasterPassword("")
        alert("최고관리자 비밀번호가 변경되었습니다. 다시 로그인해주세요.")
        setIsAuthenticated(false)
      } else {
        setError(result.error || "비밀번호 변경 실패")
      }
    } catch (err) {
      setError("비밀번호 변경 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeCompanyPassword = async () => {
    if (!newCompanyPassword || !confirmNewCompanyPassword) {
      setError("새 비밀번호를 입력해주세요.")
      return
    }

    if (newCompanyPassword !== confirmNewCompanyPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await changeCompanyAdminPassword(selectedCompanyCode, newCompanyPassword)
      if (result.success) {
        setIsChangeCompanyPasswordOpen(false)
        setSelectedCompanyCode("")
        setNewCompanyPassword("")
        setConfirmNewCompanyPassword("")
        alert(`${selectedCompanyCode} 기업 관리자 비밀번호가 변경되었습니다.`)
      } else {
        setError(result.error || "비밀번호 변경 실패")
      }
    } catch (err) {
      setError("비밀번호 변경 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!deleteConfirmUsername || !deleteConfirmPassword) {
      setError("관리자 아이디와 비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await deleteCompany(deleteCompanyCode, deleteConfirmUsername, deleteConfirmPassword)
      if (result.success) {
        setIsDeleteDialogOpen(false)
        setDeleteCompanyCode("")
        setDeleteConfirmUsername("")
        setDeleteConfirmPassword("")
        await loadCompanies()
      } else {
        setError(result.error || "기업 삭제 실패")
      }
    } catch (err) {
      setError("기업 삭제 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>기업관리자 로그인</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => router.push("/drivermgm/login")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <CardDescription>마스터 관리자 인증이 필요합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMasterLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="master-username">관리자 아이디</Label>
                <Input
                  id="master-username"
                  type="text"
                  value={masterUsername}
                  onChange={(e) => setMasterUsername(e.target.value)}
                  placeholder="관리자 아이디"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="master-password">관리자 비밀번호</Label>
                <Input
                  id="master-password"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="관리자 비밀번호"
                  required
                  disabled={isLoading}
                />
              </div>
              {loginError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{loginError}</div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">기업관리자 화면</h1>
          <Button variant="outline" onClick={() => router.push("/drivermgm/login")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            로그인 화면으로
          </Button>
        </div>

        {/* 최고관리자 비밀번호 변경 섹션 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최고관리자 설정</CardTitle>
                <CardDescription>최고관리자 (tezmenia) 비밀번호를 변경할 수 있습니다</CardDescription>
              </div>
              <Button onClick={() => setIsChangeMasterPasswordOpen(true)} variant="outline">
                <Key className="h-4 w-4 mr-2" />
                비밀번호 변경
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>등록된 기업 목록</CardTitle>
                <CardDescription>차량관리 시스템을 사용하는 기업들을 관리합니다</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                기업 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기업코드</TableHead>
                  <TableHead>기업명</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>사업자등록번호</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      등록된 기업이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow key={company.company_code}>
                      <TableCell className="font-mono">{company.company_code}</TableCell>
                      <TableCell className="font-medium">{company.company_name}</TableCell>
                      <TableCell>{new Date(company.created_at).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell>{company.phone || "-"}</TableCell>
                      <TableCell>{company.email || "-"}</TableCell>
                      <TableCell>{company.business_number || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{company.address || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCompanyCode(company.company_code)
                              setIsChangeCompanyPasswordOpen(true)
                            }}
                            title="기업 관리자 비밀번호 변경"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditCompany(company)
                              setIsEditDialogOpen(true)
                            }}
                            title="기업 정보 수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteCompanyCode(company.company_code)
                              setIsDeleteDialogOpen(true)
                            }}
                            title="기업 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 기업 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 기업 추가</DialogTitle>
            <DialogDescription>
              새로운 기업을 등록하면 해당 기업의 전용 테이블이 자동으로 생성됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-code">기업코드 (영문, 숫자만 가능)</Label>
              <Input
                id="company-code"
                value={newCompanyCode}
                onChange={(e) => setNewCompanyCode(e.target.value.toLowerCase())}
                placeholder="예: kukdong"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">기업명</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="예: 극동로지텍"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
              취소
            </Button>
            <Button onClick={handleAddCompany} disabled={isLoading}>
              {isLoading ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기업 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>기업 정보 수정</DialogTitle>
            <DialogDescription>
              기업의 정보를 수정합니다. 기업코드는 변경할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {editCompany && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company-code">기업코드</Label>
                <Input
                  id="edit-company-code"
                  value={editCompany.company_code}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company-name">기업명</Label>
                <Input
                  id="edit-company-name"
                  value={editCompany.company_name}
                  onChange={(e) => setEditCompany({ ...editCompany, company_name: e.target.value })}
                  placeholder="예: 극동로지텍"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">전화번호</Label>
                <Input
                  id="edit-phone"
                  value={editCompany.phone || ""}
                  onChange={(e) => setEditCompany({ ...editCompany, phone: e.target.value })}
                  placeholder="예: 02-1234-5678"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editCompany.email || ""}
                  onChange={(e) => setEditCompany({ ...editCompany, email: e.target.value })}
                  placeholder="예: contact@company.com"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-business-number">사업자등록번호</Label>
                <Input
                  id="edit-business-number"
                  value={editCompany.business_number || ""}
                  onChange={(e) => setEditCompany({ ...editCompany, business_number: e.target.value })}
                  placeholder="예: 123-45-67890"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">주소</Label>
                <Input
                  id="edit-address"
                  value={editCompany.address || ""}
                  onChange={(e) => setEditCompany({ ...editCompany, address: e.target.value })}
                  placeholder="예: 서울시 강남구..."
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditCompany(null)
              }}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleEditCompany} disabled={isLoading}>
              {isLoading ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 최고관리자 비밀번호 변경 다이얼로그 */}
      <Dialog open={isChangeMasterPasswordOpen} onOpenChange={setIsChangeMasterPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최고관리자 비밀번호 변경</DialogTitle>
            <DialogDescription>
              tezmenia 계정의 비밀번호를 변경합니다. 변경 후 다시 로그인해야 합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-master-password">새 비밀번호</Label>
              <Input
                id="new-master-password"
                type="password"
                value={newMasterPassword}
                onChange={(e) => setNewMasterPassword(e.target.value)}
                placeholder="새 비밀번호"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-master-password">비밀번호 확인</Label>
              <Input
                id="confirm-new-master-password"
                type="password"
                value={confirmNewMasterPassword}
                onChange={(e) => setConfirmNewMasterPassword(e.target.value)}
                placeholder="비밀번호 확인"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeMasterPasswordOpen(false)
                setNewMasterPassword("")
                setConfirmNewMasterPassword("")
              }}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleChangeMasterPassword} disabled={isLoading}>
              {isLoading ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기업 관리자 비밀번호 변경 다이얼로그 */}
      <Dialog open={isChangeCompanyPasswordOpen} onOpenChange={setIsChangeCompanyPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기업 관리자 비밀번호 변경</DialogTitle>
            <DialogDescription>
              {selectedCompanyCode} 기업의 admin 계정 비밀번호를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded">
              <p className="text-sm">
                <span className="font-medium">기업코드:</span> {selectedCompanyCode}
              </p>
              <p className="text-sm">
                <span className="font-medium">관리자 아이디:</span> admin
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-company-password">새 비밀번호</Label>
              <Input
                id="new-company-password"
                type="password"
                value={newCompanyPassword}
                onChange={(e) => setNewCompanyPassword(e.target.value)}
                placeholder="새 비밀번호"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-company-password">비밀번호 확인</Label>
              <Input
                id="confirm-new-company-password"
                type="password"
                value={confirmNewCompanyPassword}
                onChange={(e) => setConfirmNewCompanyPassword(e.target.value)}
                placeholder="비밀번호 확인"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeCompanyPasswordOpen(false)
                setSelectedCompanyCode("")
                setNewCompanyPassword("")
                setConfirmNewCompanyPassword("")
              }}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleChangeCompanyPassword} disabled={isLoading}>
              {isLoading ? "변경 중..." : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 기업 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기업 삭제 확인</DialogTitle>
            <DialogDescription>
              기업을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 관리자 인증이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-destructive/10 rounded">
              <p className="text-sm font-medium">삭제할 기업: {deleteCompanyCode}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-username">관리자 아이디</Label>
              <Input
                id="confirm-username"
                value={deleteConfirmUsername}
                onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                placeholder="tezmenia"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">관리자 비밀번호</Label>
              <Input
                id="confirm-password"
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="비밀번호"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteConfirmUsername("")
                setDeleteConfirmPassword("")
              }}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany} disabled={isLoading}>
              {isLoading ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
