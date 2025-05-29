'''
Typical addon boilerplate code
'''

bl_info = {
    "name": "Freeway Blender Addon",
    "description": "Freeway(https://freeway-rbx.app) is a helper app for Roblox artists and developers.",
    "author": "Max Ignatyev",
    "version": (0, 0, 1),
    "blender": (3, 0, 0),
    "wiki_url": "https://freeway-rbx.app",
    "category": "Export",
    "location": "None"}


import bpy
import os


def ShowMessageBox(title = "Message Box", message = "",  icon = 'INFO'):

    def draw(self, context):
        self.layout.label(text=message)

    bpy.context.window_manager.popup_menu(draw, title = title, icon = icon)


def substring_before_last(text, char):
    last_occurrence_index = text.rfind(char)
    if last_occurrence_index == -1:
        return text
    return text[:last_occurrence_index]



def export_as_gltf(path): 
    return bpy.ops.export_scene.gltf(filepath=path, export_hierarchy_full_collections=True, use_visible=True, use_active_collection=True, check_existing=True, export_format='GLB', export_apply=True, export_yup=True, export_materials='EXPORT', export_animations=False, export_cameras=False, export_lights=False)



# TODO MI Fetch this path dynamically for Windows and Mac
freeway_path = "/Users/mignatyev/freeway/files"


class FreewaySaveOperator(bpy.types.Operator):
    bl_idname = "wm.freeway_rbx_save"
    bl_label = "Save to Freeway folder"
    
        
    def execute(self, context):

        if not bpy.data.is_saved: 
            ShowMessageBox("Can't save to Freeway", "Please save the .blend file first", 'ERROR')
            return {'FINISHED'}   
        file_name = os.path.basename(bpy.data.filepath)
        file_name_no_extension = substring_before_last(file_name, ".")
        
        target_file_name = file_name_no_extension + ".glb" 
        target_path = os.path.join(freeway_path, target_file_name)
            
        result = export_as_gltf(target_path)
        ShowMessageBox("Saved to Freeway", "As " + target_file_name + ", " + str(result))
        return {'FINISHED'}



def menu_func(self, context):
   self.layout.operator(FreewaySaveOperator.bl_idname, text="Freeway Export")

def register():
    bpy.utils.register_class(FreewaySaveOperator)
    bpy.types.TOPBAR_MT_file_export.append(menu_func)

if __name__ == "__main__":
    register()
