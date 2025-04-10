"use client"

import { useState, useEffect } from "react"
import { getUserContacts, addContact, removeContact } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Phone, Plus, Trash2 } from "lucide-react"

interface ContactsListProps {
  userId: string
  onCallUser: (userId: string, username: string) => void
}

export default function ContactsList({ userId, onCallUser }: ContactsListProps) {
  const [contacts, setContacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newContactName, setNewContactName] = useState("")
  const [newContactId, setNewContactId] = useState("")

  useEffect(() => {
    async function fetchContacts() {
      try {
        const userContacts = await getUserContacts(userId)
        setContacts(userContacts)
      } catch (error) {
        console.error("Error fetching contacts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [userId])

  async function handleAddContact() {
    if (!newContactName || !newContactId) return

    try {
      const newContact = await addContact({
        userId,
        name: newContactName,
        contactId: newContactId,
      })

      setContacts([...contacts, newContact])
      setNewContactName("")
      setNewContactId("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding contact:", error)
    }
  }

  async function handleRemoveContact(contactId: string) {
    try {
      await removeContact(userId, contactId)
      setContacts(contacts.filter((contact) => contact.id !== contactId))
    } catch (error) {
      console.error("Error removing contact:", error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contacts</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="id" className="text-sm font-medium">
                  User ID
                </label>
                <Input
                  id="id"
                  value={newContactId}
                  onChange={(e) => setNewContactId(e.target.value)}
                  placeholder="Contact user ID"
                />
              </div>
              <Button onClick={handleAddContact} className="w-full">
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No contacts</div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                <div className="font-medium">{contact.name}</div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => onCallUser(contact.contactId, contact.name)}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleRemoveContact(contact.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
