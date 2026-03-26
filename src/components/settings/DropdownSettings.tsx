import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, PlusCircle, Users, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Predefined color options for intern cards
const INTERN_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
];

export function DropdownSettings() {
  // Subscribe to dropdowns from store for real-time updates across devices
  const dropdowns = useClientStore((state) => state.dropdowns);
  const addDropdownField = useClientStore((state) => state.addDropdownField);
  const updateDropdownField = useClientStore((state) => state.updateDropdownField);
  const deleteDropdownField = useClientStore((state) => state.deleteDropdownField);
  const addDropdownOption = useClientStore((state) => state.addDropdownOption);
  const updateDropdownOption = useClientStore((state) => state.updateDropdownOption);
  const deleteDropdownOption = useClientStore((state) => state.deleteDropdownOption);
  const currentUser = useClientStore((state) => state.currentUser);

  // Intern names state
  const internNames = useClientStore((state) => state.internNames);
  const addInternName = useClientStore((state) => state.addInternName);
  const updateInternName = useClientStore((state) => state.updateInternName);
  const deleteInternNameRecord = useClientStore((state) => state.deleteInternNameRecord);

  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [editingField, setEditingField] = useState<{ id: string; name: string } | null>(null);
  const [editingOption, setEditingOption] = useState<{ fieldId: string; index: number; value: string } | null>(null);
  const [newOptionValue, setNewOptionValue] = useState<{ fieldId: string; value: string } | null>(null);

  // Intern names form state
  const [newInternName, setNewInternName] = useState('');
  const [selectedColor, setSelectedColor] = useState(INTERN_COLORS[0].value);
  const [editingIntern, setEditingIntern] = useState<{ id: string; name: string; color: string } | null>(null);

  // Reset editing states when dropdowns update from other devices
  useEffect(() => {
    if (editingField) {
      const dropdown = dropdowns.find(d => d.id === editingField.id);
      if (!dropdown) {
        setEditingField(null);
      }
    }
    if (editingOption) {
      const dropdown = dropdowns.find(d => d.id === editingOption.fieldId);
      if (!dropdown || !dropdown.options[editingOption.index]) {
        setEditingOption(null);
      }
    }
    if (newOptionValue) {
      const dropdown = dropdowns.find(d => d.id === newOptionValue.fieldId);
      if (!dropdown) {
        setNewOptionValue(null);
      }
    }
  }, [dropdowns, editingField, editingOption, newOptionValue]);

  // Reset intern editing state when internNames update
  useEffect(() => {
    if (editingIntern) {
      const intern = internNames.find(i => i.id === editingIntern.id);
      if (!intern) {
        setEditingIntern(null);
      }
    }
  }, [internNames, editingIntern]);

  const handleAddField = () => {
    if (!newFieldName.trim() || !newFieldOptions.trim()) {
      toast.error('Please fill in both field name and options');
      return;
    }

    const options = newFieldOptions.split(',').map(o => o.trim()).filter(Boolean);
    if (options.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    addDropdownField({
      name: newFieldName.trim(),
      options,
      createdBy: currentUser?.id || 'admin'
    });

    setNewFieldName('');
    setNewFieldOptions('');
    toast.success(`Dropdown "${newFieldName}" created successfully!`);
  };

  const handleUpdateFieldName = () => {
    if (!editingField || !editingField.name.trim()) {
      toast.error('Field name cannot be empty');
      return;
    }
    updateDropdownField(editingField.id, { name: editingField.name.trim() });
    setEditingField(null);
    toast.success('Field name updated!');
  };

  const handleDeleteField = (id: string, name: string) => {
    deleteDropdownField(id);
    toast.success(`Dropdown "${name}" deleted!`);
  };

  const handleUpdateOption = () => {
    if (!editingOption || !editingOption.value.trim()) {
      toast.error('Option value cannot be empty');
      return;
    }
    updateDropdownOption(editingOption.fieldId, editingOption.index, editingOption.value.trim());
    setEditingOption(null);
    toast.success('Option updated!');
  };

  const handleDeleteOption = (fieldId: string, index: number, optionName: string) => {
    const dropdown = dropdowns.find(d => d.id === fieldId);
    if (dropdown && dropdown.options.length <= 2) {
      toast.error('Dropdown must have at least 2 options');
      return;
    }
    deleteDropdownOption(fieldId, index);
    toast.success(`Option "${optionName}" deleted!`);
  };

  const handleAddOption = () => {
    if (!newOptionValue || !newOptionValue.value.trim()) {
      toast.error('Option value cannot be empty');
      return;
    }
    const dropdown = dropdowns.find(d => d.id === newOptionValue.fieldId);
    if (dropdown?.options.includes(newOptionValue.value.trim())) {
      toast.error('Option already exists');
      return;
    }
    addDropdownOption(newOptionValue.fieldId, newOptionValue.value.trim());
    setNewOptionValue(null);
    toast.success('Option added!');
  };

  // Intern name handlers
  const handleAddInternName = async () => {
    if (!newInternName.trim()) {
      toast.error('Please enter intern name');
      return;
    }

    try {
      await addInternName(newInternName.trim(), selectedColor);
      setNewInternName('');
      setSelectedColor(INTERN_COLORS[0].value);
      toast.success(`Intern "${newInternName}" added successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add intern');
    }
  };

  const handleUpdateInternName = async () => {
    if (!editingIntern || !editingIntern.name.trim()) {
      toast.error('Intern name cannot be empty');
      return;
    }

    try {
      await updateInternName(editingIntern.id, {
        name: editingIntern.name.trim(),
        color: editingIntern.color
      });
      setEditingIntern(null);
      toast.success('Intern updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update intern');
    }
  };

  const handleDeleteInternName = async (id: string, name: string) => {
    try {
      await deleteInternNameRecord(id);
      toast.success(`Intern "${name}" deleted!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete intern');
    }
  };

  return (
    <div className="space-y-6">
      {/* Manage Intern Names */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Intern Names
          </CardTitle>
          <CardDescription>
            Add intern names that will appear on the Intern Login page for quick selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Intern Form */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter intern name"
                value={newInternName}
                onChange={(e) => setNewInternName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Color:</span>
              </div>
              <div className="flex gap-1.5">
                {INTERN_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAddInternName} disabled={!newInternName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Intern
            </Button>
          </div>

          {/* Existing Interns */}
          {internNames.length === 0 ? (
            <div className="text-center py-6 px-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No interns added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add intern names above to enable quick selection on Intern Login</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {internNames.map((intern) => (
                editingIntern?.id === intern.id ? (
                  <div key={intern.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
                    <Input
                      value={editingIntern.name}
                      onChange={(e) => setEditingIntern({ ...editingIntern, name: e.target.value })}
                      className="h-8 w-32"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {INTERN_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            editingIntern.color === color.value
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setEditingIntern({ ...editingIntern, color: color.value })}
                        />
                      ))}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdateInternName}>
                      <Save className="h-3 w-3 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingIntern(null)}>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div
                    key={intern.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border group hover:shadow-sm transition-all"
                    style={{ backgroundColor: `${intern.color}15`, borderColor: `${intern.color}40` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: intern.color }}
                    />
                    <span className="font-medium text-sm">{intern.name}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setEditingIntern({ id: intern.id, name: intern.name, color: intern.color })}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{intern.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove this intern from the quick selection list. This won't affect existing session records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteInternName(intern.id, intern.name)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Dropdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Dropdown Field
          </CardTitle>
          <CardDescription>
            Add custom dropdown fields that will appear on all client cards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Field Name</label>
              <Input
                placeholder="e.g., Travel Type"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Options (comma-separated)</label>
              <Input
                placeholder="e.g., Domestic, International, Both"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAddField} disabled={!newFieldName.trim() || !newFieldOptions.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dropdown
          </Button>
        </CardContent>
      </Card>

      {/* Existing Dropdowns */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Existing Dropdown Fields</CardTitle>
          <CardDescription>
            Manage dropdown options for all client cards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dropdowns.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Dropdown Fields Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Create your first dropdown field above. These fields will appear on all client cards and help you organize your leads.
              </p>
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="font-medium mb-2">Suggested dropdowns to create:</p>
                <ul className="text-left space-y-1">
                  <li>• <strong>Lead Status</strong> - New Lead, Hot Lead, Warm Lead, Cold Lead, Converted, Lost</li>
                  <li>• <strong>Call Outcome</strong> - Not Reached, Interested, Not Interested, Call Back, Booked</li>
                  <li>• <strong>Priority</strong> - High, Medium, Low</li>
                </ul>
              </div>
            </div>
          ) : (
          dropdowns.map((dropdown) => (
            <div 
              key={dropdown.id}
              className="p-4 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="flex items-center justify-between mb-3">
                {editingField?.id === dropdown.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <Input
                      value={editingField.name}
                      onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                      className="h-8"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUpdateFieldName}>
                      <Save className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingField(null)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{dropdown.name}</h4>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6" 
                      onClick={() => setEditingField({ id: dropdown.id, name: dropdown.name })}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {dropdown.options.length} options
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{dropdown.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this dropdown field and remove it from all client cards. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteField(dropdown.id, dropdown.name)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {dropdown.options.map((option, index) => (
                  editingOption?.fieldId === dropdown.id && editingOption?.index === index ? (
                    <div key={index} className="flex items-center gap-1">
                      <Input
                        value={editingOption.value}
                        onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
                        className="h-9 md:h-7 w-36 md:w-32 text-sm"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 md:h-7 md:w-7 touch-manipulation" onClick={handleUpdateOption}>
                        <Save className="h-4 w-4 md:h-3 md:w-3 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 md:h-7 md:w-7 touch-manipulation" onClick={() => setEditingOption(null)}>
                        <X className="h-4 w-4 md:h-3 md:w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="cursor-default hover:bg-muted/50 group pr-1 py-1.5 md:py-0.5 touch-manipulation"
                    >
                      <span>{option}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 md:h-4 md:w-4 ml-1 opacity-100 md:opacity-0 group-hover:opacity-100 touch-manipulation"
                        onClick={() => setEditingOption({ fieldId: dropdown.id, index, value: option })}
                      >
                        <Edit2 className="h-3 w-3 md:h-2.5 md:w-2.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 md:h-4 md:w-4 opacity-100 md:opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive touch-manipulation"
                        onClick={() => handleDeleteOption(dropdown.id, index, option)}
                      >
                        <X className="h-3 w-3 md:h-2.5 md:w-2.5" />
                      </Button>
                    </Badge>
                  )
                ))}
                {newOptionValue?.fieldId === dropdown.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newOptionValue.value}
                      onChange={(e) => setNewOptionValue({ ...newOptionValue, value: e.target.value })}
                      placeholder="New option"
                      className="h-9 md:h-7 w-36 md:w-32 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-9 w-9 md:h-7 md:w-7 touch-manipulation" onClick={handleAddOption}>
                      <Save className="h-4 w-4 md:h-3 md:w-3 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 md:h-7 md:w-7 touch-manipulation" onClick={() => setNewOptionValue(null)}>
                      <X className="h-4 w-4 md:h-3 md:w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 md:h-6 text-sm md:text-xs gap-1 touch-manipulation"
                    onClick={() => setNewOptionValue({ fieldId: dropdown.id, value: '' })}
                  >
                    <PlusCircle className="h-4 w-4 md:h-3 md:w-3" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
