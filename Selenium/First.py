import openpyxl
import time
book = openpyxl.load_workbook("C:\\Users\\LJA095\\OneDrive - Maersk Group\\Documents\\Neonnav L2 To L3\L2 to L3 Auto rerouting.xlsx")
time.sleep(5)
print("hi")
sheet = book.active
time.sleep(1)
print(type(sheet))
data = sheet.cell(row = 2, column = 3)
print(data.value())
csr = data.value()