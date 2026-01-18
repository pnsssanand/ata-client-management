import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, PlusCircle } from 'lucide-react';
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

export function DropdownSettings() {
  const { 
    dropdowns, 
    addDropdownField, 
    updateDropdownField,
    deleteDropdownField,
    addDropdownOption,
    updateDropdownOption,
    deleteDropdownOption,
    currentUser 
  } = useClientStore();
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [editingField, setEditingField] = useState<{ id: string; name: string } | null>(null);
  const [editingOption, setEditingOption] = useState<{ fieldId: string; index: number; value: string } | null>(null);
  const [newOptionValue, setNewOptionValue] = useState<{ fieldId: string; value: string } | null>(null);

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

  return (
    <div className="space-y-6">
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
          {dropdowns.map((dropdown) => (
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
                        className="h-7 w-32 text-sm"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdateOption}>
                        <Save className="h-3 w-3 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingOption(null)}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="cursor-default hover:bg-muted/50 group pr-1"
                    >
                      <span>{option}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100"
                        onClick={() => setEditingOption({ fieldId: dropdown.id, index, value: option })}
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteOption(dropdown.id, index, option)}
                      >
                        <X className="h-2.5 w-2.5" />
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
                      className="h-7 w-32 text-sm"
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAddOption}>
                      <Save className="h-3 w-3 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewOptionValue(null)}>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-xs gap-1"
                    onClick={() => setNewOptionValue({ fieldId: dropdown.id, value: '' })}
                  >
                    <PlusCircle className="h-3 w-3" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
