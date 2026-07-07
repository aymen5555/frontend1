from pathlib import Path
path = Path('src/app/components/subscriptions/admin/subscription-admin.component.ts')
text = path.read_text(encoding='utf-8')
start = text.index('template: `') + len('template: `')
end = text.index('`\n  styles', start)
template = text[start:end]
print('Template length:', len(template))
print('Backticks in template:', template.count('`'))
print('Open div count:', template.count('<div'))
print('Close div count:', template.count('</div>'))
print('Open form count:', template.count('<form'))
print('Close form count:', template.count('</form>'))
print('Open span count:', template.count('<span'))
print('Close span count:', template.count('</span>'))
# identify unclosed tags in simple stack
import re
stack=[]
for i,line in enumerate(template.splitlines(),1):
    for m in re.finditer(r'<(/?)(div|form|select|textarea|button|section|p|span|h[1-6]|label|input|option|template|ng-template|app-loader)(\s|>|/)', line):
        tag=m.group(2)
        if tag in ('input','option','br','img'):
            continue
        if m.group(1)== '/':
            if stack and stack[-1]==tag:
                stack.pop()
            else:
                print('MISMATCH close', tag, 'at line', i, 'stack top', stack[-1] if stack else None)
        else:
            if tag in ('input','option','br','img'):
                continue
            stack.append(tag)
print('Remaining stack length', len(stack), stack[-10:])
