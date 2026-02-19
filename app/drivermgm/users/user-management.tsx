"use client"

import { useState } from "react"
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
import { Plus, Trash2, Key, ChevronLeft } from "lucide-react"
import { addVehicleUser, deleteVehicleUser, updateVehicleUserPassword } from "./actions"
import { useRouter } from "next/navigation"

interface User {
  id: number
  username: string
  created_at: string
}

interface UserManagementProps {
  initialUsers: User[]
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleAddUser = async () => {
    if (!newUsername || !newPassword || !confirmPassword) {
      alert("모든 필드를 입력해주세요.")
      return
    }

    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    const result = await addVehicleUser(newUsername, newPassword)
    if (result.success) {
      alert("사용자가 추가되었습니다.")
      setIsAddDialogOpen(false)
      setNewUsername("")
      setNewPassword("")
      setConfirmPassword("")
      router.refresh()
    } else {
      alert(result.error || "사용자 추가에 실패했습니다.")
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (username === "human") {
      alert("기본 관리자 계정은 삭제할 수 없습니다.")
      return
    }

    if (!confirm(`사용자 "${username}"을(를) 삭제하시겠습니까?`)) {
      return
    }

    const result = await deleteVehicleUser(userId)
    if (result.success) {
      alert("사용자가 삭제되었습니다.")
      router.refresh()
    } else {
      alert(result.error || "사용자 삭제에 실패했습니다.")
    }
  }

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword || !confirmPassword) {
      alert("모든 필드를 입력해주세요.")
      return
    }

    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    const result = await updateVehicleUserPassword(selectedUser.id, newPassword)
    if (result.success) {
      alert("비밀번호가 변경되었습니다.")
      setIsPasswordDialogOpen(false)
      setSelectedUser(null)
      setNewPassword("")
      setConfirmPassword("")
    } else {
      alert(result.error || "비밀번호 변경에 실패했습니다.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/drivermgm")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>사용자 관리</CardTitle>
              <CardDescription>차량관리시스템 사용자를 추가, 삭제 및 비밀번호를 변경할 수 있습니다.</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              사용자 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>사용자명</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("ko-KR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsPasswordDialogOpen(true)
                        }}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        비밀번호 변경
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={user.username === "human"}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 사용자 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 사용자 추가</DialogTitle>
            <DialogDescription>새로운 사용자 계정을 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">사용자명</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="사용자명 입력"
              />
            </div>
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="비밀번호 입력"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddUser}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>{selectedUser?.username}의 비밀번호를 변경합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력"
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">새 비밀번호 확인</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 재입력"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false)
                setSelectedUser(null)
                setNewPassword("")
                setConfirmPassword("")
              }}
            >
              취소
            </Button>
            <Button onClick={handleChangePassword}>변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
