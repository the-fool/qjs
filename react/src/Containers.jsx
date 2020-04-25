import styled from 'styled-components';

export const RowContainer = styled.div`
    display: flex;
    flex-direction: row;

    > * {
        margin-right: ${props => props.spacing}px;
    }
    *:last-child {
        margin-right: 0px;
    }
    width: content;
`;

export const ColumnContainer = styled.div`
    display: flex;
    flex-direction: column;
    > * {
        margin-bottom: ${props => props.spacing}px;
    }
    *:last-child {
        margin-bottom: 0px;
    }
`;
