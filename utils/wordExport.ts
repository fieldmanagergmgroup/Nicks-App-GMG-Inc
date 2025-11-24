import { Site, User } from '../types';

function downloadDoc(htmlContent: string, fileName: string) {
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
    
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const exportSitesToWord = (sites: Site[], users: User[]) => {
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const styles = `
        <style>
            body { font-family: Arial, sans-serif; font-size: 11pt; }
            h1 { color: #003B65; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
            th { background-color: #f2f2f2; }
            .site-block { page-break-inside: avoid; margin-bottom: 20px; }
            .scope { white-space: pre-wrap; }
        </style>
    `;

    let content = `
        <html>
            <head>
                <meta charset="UTF-8">
                ${styles}
            </head>
            <body>
                <h1>GM Group Inc. - Master Site List</h1>
                <p>Exported on: ${new Date().toLocaleDateString()}</p>
    `;

    content += `
        <table>
            <thead>
                <tr>
                    <th>Client Name</th>
                    <th>Address</th>
                    <th>Frequency</th>
                    <th>Status</th>
                    <th>Assigned Consultant</th>
                    <th>Scope of Work</th>
                    <th>Contacts</th>
                </tr>
            </thead>
            <tbody>
    `;

    sites.forEach(site => {
        const consultantName = userMap.get(site.assignedConsultantId) || 'Unassigned';
        const contactsHtml = site.contacts.map(c => 
            `<b>${c.role}:</b> ${c.name} (${c.info})`
        ).join('<br>');

        content += `
            <tr>
                <td>${site.clientName}</td>
                <td>${site.address}</td>
                <td>${site.frequency}</td>
                <td>${site.status}</td>
                <td>${consultantName}</td>
                <td class="scope">${site.scopeOfWork}</td>
                <td>${contactsHtml || 'N/A'}</td>
            </tr>
        `;
    });

    content += `
            </tbody>
        </table>
        </body>
    </html>`;

    downloadDoc(content, `GMG_Master_Site_List_${new Date().toISOString().split('T')[0]}.doc`);
};
